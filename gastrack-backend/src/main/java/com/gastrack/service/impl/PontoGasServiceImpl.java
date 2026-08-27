package com.gastrack.service.impl;

import com.gastrack.dto.pontogas.PontoGasMonitoringResponse;
import com.gastrack.dto.pontogas.PontoGasMonitoringResponse.MonitoringCylinderView;
import com.gastrack.dto.pontogas.PontoGasRequest;
import com.gastrack.dto.pontogas.PontoGasResponse;
import com.gastrack.dto.pontogas.PontoGasStatusUpdateRequest;
import com.gastrack.dto.pontogas.SensorAssignment;
import com.gastrack.service.CylinderStatusCalculator;
import com.gastrack.exceptions.BusinessException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.PontoGasMapper;
import com.gastrack.model.Address;
import com.gastrack.model.Company;
import com.gastrack.model.Cylinder;
import com.gastrack.model.Equipment;
import com.gastrack.model.EquipmentKit;
import com.gastrack.model.EquipmentType;
import com.gastrack.model.PontoGas;
import com.gastrack.model.RefillEvent;
import com.gastrack.model.RefillSource;
import com.gastrack.repository.AddressRepository;
import com.gastrack.repository.CylinderRepository;
import com.gastrack.repository.EquipmentKitRepository;
import com.gastrack.repository.EquipmentRepository;
import com.gastrack.repository.EquipmentTypeRepository;
import com.gastrack.repository.PontoGasRepository;
import com.gastrack.repository.RefillEventRepository;
import com.gastrack.service.PontoGasService;
import com.gastrack.service.TenantSecurityService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PontoGasServiceImpl implements PontoGasService {

    private static final String SENSOR_TYPE_NAME = "Sensor";

    /** Fill jump (in percentage points) above which a reading is treated as a refill. */
    private static final double AUTO_REFILL_THRESHOLD = 40.0;

    /** Global fallback for the "sem sinal" limit when a company has no override (spec §6). */
    private static final int DEFAULT_STALE_THRESHOLD_MINUTES = 60;

    static final String STALE_STATUS = "SEM_SINAL";

    private final PontoGasRepository pontoGasRepository;
    private final AddressRepository addressRepository;
    private final EquipmentRepository equipmentRepository;
    private final EquipmentTypeRepository equipmentTypeRepository;
    private final EquipmentKitRepository equipmentKitRepository;
    private final RefillEventRepository refillEventRepository;
    private final CylinderRepository cylinderRepository;
    private final PontoGasMapper pontoGasMapper;
    private final TenantSecurityService tenantSecurityService;
    private final CylinderStatusCalculator statusCalculator;

    @Override
    @Transactional
    public PontoGasResponse create(PontoGasRequest request) {
        validateSingleSensor(request);
        log.info("Creating gas point for address id: {}", request.addressId());

        Address address = addressRepository.findById(request.addressId())
            .orElseThrow(() -> new ResourceNotFoundException("Address", "id", request.addressId()));

        tenantSecurityService.validateCompanyAccess(address.getCompany().getId());

        PontoGas pontoGas = pontoGasMapper.toEntity(request);
        pontoGas.setAddress(address);
        if (request.sensorEquipmentIds() != null && !request.sensorEquipmentIds().isEmpty()) {
            for (Long equipmentId : request.sensorEquipmentIds()) {
                associateSensorEquipment(equipmentId, pontoGas);
            }
        }
        if (request.sensorsToAdd() != null && !request.sensorsToAdd().isEmpty()) {
            for (SensorAssignment sa : request.sensorsToAdd()) {
                Equipment sensor = findOrCreateSensorEquipment(sa.parentEquipmentId(), sa.sensorPort());
                associateSensorEquipment(sensor.getId(), pontoGas);
            }
        }

        PontoGas saved = pontoGasRepository.save(pontoGas);

        log.info("Gas point created successfully with id: {}", saved.getId());
        return pontoGasMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PontoGasResponse findById(Long id) {
        PontoGas pontoGas = pontoGasRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PontoGas", "id", id));

        tenantSecurityService.validateCompanyAccess(pontoGas.getAddress().getCompany().getId());

        return pontoGasMapper.toResponse(pontoGas);
    }

    @Override
    @Transactional(readOnly = true)
    public PontoGasMonitoringResponse getMonitoring(Long id) {
        PontoGas point = pontoGasRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PontoGas", "id", id));

        Address address = point.getAddress();
        tenantSecurityService.validateCompanyAccess(address.getCompany().getId());

        boolean stale = isReadingStale(point, address.getCompany());
        String effectiveStatus = stale ? STALE_STATUS : point.getStatus().name();

        Double fill = statusCalculator.calculateFillPercentage(
            point.getCurrentPressureBar(), point.getEffectiveFullTankPressureBar());

        List<MonitoringCylinderView> cylinders = cylinderRepository
            .findByPontoGasIdAndActiveTrue(id).stream()
            .map(c -> new MonitoringCylinderView(
                c.getId(),
                c.getSerialNumber(),
                c.getCylinderModel() != null ? c.getCylinderModel().getGasType() : null,
                c.getCylinderModel() != null ? c.getCylinderModel().getWaterVolumeLiters() : null))
            .toList();

        return new PontoGasMonitoringResponse(
            point.getId(),
            point.getLocation(),
            address.getId(),
            address.getName(),
            point.getCurrentPressureBar(),
            point.getEffectiveFullTankPressureBar(),
            point.getEffectiveCapacityLiters(),
            point.getAvailableCubicMeters(),
            fill,
            point.getLastReadingAt(),
            point.getStatus(),
            stale,
            effectiveStatus,
            cylinders);
    }

    /**
     * A point has "no signal" when it has never reported or its last reading is older than the
     * company override ({@code staleReadingThresholdMinutes}), falling back to the global default.
     */
    private boolean isReadingStale(PontoGas point, Company company) {
        LocalDateTime last = point.getLastReadingAt();
        if (last == null) {
            return true;
        }
        int minutes = company != null && company.getStaleReadingThresholdMinutes() != null
            ? company.getStaleReadingThresholdMinutes()
            : DEFAULT_STALE_THRESHOLD_MINUTES;
        return last.isBefore(LocalDateTime.now(ZoneOffset.UTC).minusMinutes(minutes));
    }

    @Override
    @Transactional
    public PontoGasResponse updateStatus(Long id, PontoGasStatusUpdateRequest request) {
        log.info("Updating pressure reading for gas point with id: {}", id);

        PontoGas pontoGas = pontoGasRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PontoGas", "id", id));

        tenantSecurityService.validateCompanyAccess(pontoGas.getAddress().getCompany().getId());

        PontoGas saved = applyReadingTo(pontoGas, request.currentPressureBar());

        log.info("Gas point reading updated successfully with id: {}", saved.getId());
        return pontoGasMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void applyReading(Long pontoGasId, BigDecimal pressureBar) {
        PontoGas pontoGas = pontoGasRepository.findById(pontoGasId)
            .orElseThrow(() -> new ResourceNotFoundException("PontoGas", "id", pontoGasId));
        applyReadingTo(pontoGas, pressureBar);
    }

    /**
     * Aplica uma leitura de pressão à linha: atualiza pressão/status e registra reabastecimento
     * automático se o nível saltou. NÃO valida tenant — o chamador é responsável por isso
     * (o endpoint valida; o job de sincronização roda como sistema, sem usuário autenticado).
     */
    private PontoGas applyReadingTo(PontoGas pontoGas, BigDecimal pressureBar) {
        BigDecimal fullTank = pontoGas.getEffectiveFullTankPressureBar();

        Double previousFill = statusCalculator.calculateFillPercentage(
            pontoGas.getCurrentPressureBar(), fullTank);

        statusCalculator.updatePressureAndStatus(pontoGas, pressureBar);

        Double newFill = statusCalculator.calculateFillPercentage(pressureBar, fullTank);

        PontoGas saved = pontoGasRepository.save(pontoGas);

        recordAutoRefillIfJumped(saved, previousFill, newFill);

        return saved;
    }

    /**
     * Persists an AUTO {@link RefillEvent} when the derived fill jumps above the threshold
     * (a bottle swap detected by the sensor). Never blocks the normal reading update.
     */
    private void recordAutoRefillIfJumped(PontoGas pontoGas, Double previousFill, Double newFill) {
        if (previousFill == null || newFill == null) {
            return;
        }
        if (newFill - previousFill <= AUTO_REFILL_THRESHOLD) {
            return;
        }
        RefillEvent event = RefillEvent.builder()
            .gasPoint(pontoGas)
            .detectedAt(LocalDateTime.now(ZoneOffset.UTC))
            .fromFill(BigDecimal.valueOf(previousFill))
            .toFill(BigDecimal.valueOf(newFill))
            .source(RefillSource.AUTO)
            .build();
        refillEventRepository.save(event);
        log.info("AUTO refill recorded for gas point {}: {}% -> {}%", pontoGas.getId(), previousFill, newFill);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PontoGasResponse> findAll(Boolean active, Pageable pageable) {
        if (tenantSecurityService.isSuperAdmin()) {
            if (active != null) {
                return pontoGasRepository.findByActive(active, pageable)
                    .map(pontoGasMapper::toResponse);
            }
            return pontoGasRepository.findAll(pageable)
                .map(pontoGasMapper::toResponse);
        }

        Long companyId = tenantSecurityService.requireCompanyContext();

        if (active != null) {
            return pontoGasRepository.findByAddressCompanyIdAndActive(companyId, active, pageable)
                .map(pontoGasMapper::toResponse);
        }
        return pontoGasRepository.findByAddressCompanyId(companyId, pageable)
            .map(pontoGasMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PontoGasResponse> findByAddressId(Long addressId, Boolean active, Pageable pageable) {
        Address address = addressRepository.findById(addressId)
            .orElseThrow(() -> new ResourceNotFoundException("Address", "id", addressId));
        tenantSecurityService.validateCompanyAccess(address.getCompany().getId());

        if (active != null) {
            return pontoGasRepository.findByAddressIdAndActive(addressId, active, pageable)
                .map(pontoGasMapper::toResponse);
        }
        return pontoGasRepository.findByAddressId(addressId, pageable)
            .map(pontoGasMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PontoGasResponse> findByAddressIdAndKitId(Long addressId, Long kitId, Boolean active, Pageable pageable) {
        Address address = addressRepository.findById(addressId)
            .orElseThrow(() -> new ResourceNotFoundException("Address", "id", addressId));
        tenantSecurityService.validateCompanyAccess(address.getCompany().getId());

        EquipmentKit kit = equipmentKitRepository.findById(kitId)
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentKit", "id", kitId));
        if (kit.getAddress() == null || !kit.getAddress().getId().equals(addressId)) {
            throw new BusinessException("Kit does not belong to the provided address");
        }
        tenantSecurityService.validateCompanyAccess(kit.getContract().getCompany().getId());

        if (active != null) {
            return pontoGasRepository.findByAddressIdAndKitIdAndActive(addressId, kitId, active, pageable)
                .map(pontoGasMapper::toResponse);
        }
        return pontoGasRepository.findByAddressIdAndKitId(addressId, kitId, pageable)
            .map(pontoGasMapper::toResponse);
    }

    @Override
    @Transactional
    public PontoGasResponse update(Long id, PontoGasRequest request) {
        validateSingleSensor(request);
        log.info("Updating gas point with id: {}", id);

        PontoGas pontoGas = pontoGasRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PontoGas", "id", id));

        tenantSecurityService.validateCompanyAccess(pontoGas.getAddress().getCompany().getId());

        if (!pontoGas.getAddress().getId().equals(request.addressId())) {
            Address newAddress = addressRepository.findById(request.addressId())
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", request.addressId()));
            tenantSecurityService.validateCompanyAccess(newAddress.getCompany().getId());
            pontoGas.setAddress(newAddress);
        }

        pontoGasMapper.updateEntity(request, pontoGas);

        // Replace sensor equipment in two phases to avoid transient unique constraint collisions on gas_point_id:
        // 1) unlink current sensors and flush, 2) link requested sensor.
        if (request.sensorEquipmentIds() != null || request.sensorsToAdd() != null) {
            List<Equipment> currentSensors = new ArrayList<>(pontoGas.getEquipments());
            currentSensors.forEach(e -> e.setPontoGas(null));
            pontoGas.getEquipments().clear();
            if (!currentSensors.isEmpty()) {
                equipmentRepository.saveAll(currentSensors);
                equipmentRepository.flush();
            }
            if (request.sensorEquipmentIds() != null && !request.sensorEquipmentIds().isEmpty()) {
                for (Long equipmentId : request.sensorEquipmentIds()) {
                    associateSensorEquipment(equipmentId, pontoGas);
                }
            }
            if (request.sensorsToAdd() != null && !request.sensorsToAdd().isEmpty()) {
                for (SensorAssignment sa : request.sensorsToAdd()) {
                    Equipment sensor = findOrCreateSensorEquipment(sa.parentEquipmentId(), sa.sensorPort());
                    associateSensorEquipment(sensor.getId(), pontoGas);
                }
            }
        }

        PontoGas saved = pontoGasRepository.save(pontoGas);

        log.info("Gas point updated successfully with id: {}", saved.getId());
        return pontoGasMapper.toResponse(saved);
    }

    private void validateSingleSensor(PontoGasRequest request) {
        int sensorCount = 0;
        if (request.sensorEquipmentIds() != null) {
            sensorCount += request.sensorEquipmentIds().size();
        }
        if (request.sensorsToAdd() != null) {
            sensorCount += request.sensorsToAdd().size();
        }
        if (sensorCount > 1) {
            throw new BusinessException("Each gas point can have at most one sensor");
        }
    }

    private void associateSensorEquipment(Long equipmentId, PontoGas pontoGas) {
        Equipment equipment = equipmentRepository.findById(equipmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Equipment", "id", equipmentId));

        // Ensure equipment is active
        if (!Boolean.TRUE.equals(equipment.getActive())) {
            throw new BusinessException("Only active equipment can be associated to a gas point");
        }

        // Ensure equipment is not already linked to another gas point
        if (equipment.getPontoGas() != null && !equipment.getPontoGas().getId().equals(pontoGas.getId())) {
            throw new BusinessException("Equipment is already associated to another gas point");
        }

        // Delegate Sensor-type validation to the entity helper
        pontoGas.addEquipment(equipment);
    }

    private Equipment findOrCreateSensorEquipment(Long parentEquipmentId, Integer sensorPort) {
        if (sensorPort == null || sensorPort < 1 || sensorPort > 8) {
            throw new BusinessException("sensorPort must be between 1 and 8");
        }

        // First try by parent + port (ideal case)
        Optional<Equipment> byParentAndPort = equipmentRepository
            .findByParentEquipmentIdAndSensorPort(parentEquipmentId, sensorPort);
        if (byParentAndPort.isPresent()) {
            return byParentAndPort.get();
        }

        // Fallback: check by codigoSensor to avoid duplicate key
        Equipment parent = equipmentRepository.findById(parentEquipmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Equipment", "id", parentEquipmentId));
        if (parent.getSerialNumber() == null || parent.getSerialNumber().isBlank()) {
            throw new BusinessException("Parent ESP32 must have serial number to create sensor");
        }
        String codigoSensor = parent.getSerialNumber() + "|" + sensorPort;
        Optional<Equipment> byCodigoSensor = equipmentRepository.findByCodigoSensor(codigoSensor);
        if (byCodigoSensor.isPresent()) {
            Equipment existing = byCodigoSensor.get();
            // Fix corrupted parent reference if needed
            if (existing.getParentEquipment() == null || !existing.getParentEquipment().getId().equals(parentEquipmentId)) {
                existing.setParentEquipment(parent);
                existing.setSensorPort(sensorPort);
                return equipmentRepository.save(existing);
            }
            return existing;
        }

        return createSensorEquipment(parent, sensorPort, codigoSensor);
    }

    private Equipment createSensorEquipment(Equipment parent, Integer sensorPort, String codigoSensor) {
        EquipmentType sensorType = equipmentTypeRepository.findByName(SENSOR_TYPE_NAME)
            .orElseThrow(() -> new BusinessException("Equipment type 'Sensor' not found. Run migrations."));
        String assetTag = parent.getAssetTag() + "-P" + sensorPort;
        int suffix = 0;
        while (equipmentRepository.existsByAssetTag(assetTag)) {
            suffix++;
            assetTag = parent.getAssetTag() + "-P" + sensorPort + "-" + suffix;
        }
        Equipment sensor = Equipment.builder()
            .equipmentType(sensorType)
            .parentEquipment(parent)
            .sensorPort(sensorPort)
            .codigoSensor(codigoSensor)
            .assetTag(assetTag)
            .equipmentKit(parent.getEquipmentKit())
            .condition(parent.getCondition())
            .active(true)
            .build();
        return equipmentRepository.save(sensor);
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        log.info("Deactivating gas point with id: {}", id);

        PontoGas pontoGas = pontoGasRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PontoGas", "id", id));

        tenantSecurityService.validateCompanyAccess(pontoGas.getAddress().getCompany().getId());

        pontoGas.setActive(false);
        pontoGasRepository.save(pontoGas);

        log.info("Gas point deactivated successfully with id: {}", id);
    }

    @Override
    @Transactional
    public void activate(Long id) {
        log.info("Activating gas point with id: {}", id);

        PontoGas pontoGas = pontoGasRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PontoGas", "id", id));

        tenantSecurityService.validateCompanyAccess(pontoGas.getAddress().getCompany().getId());

        pontoGas.setActive(true);
        pontoGasRepository.save(pontoGas);

        log.info("Gas point activated successfully with id: {}", id);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info("Hard deleting gas point with id: {}", id);

        PontoGas pontoGas = pontoGasRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PontoGas", "id", id));

        tenantSecurityService.validateCompanyAccess(pontoGas.getAddress().getCompany().getId());

        List<Equipment> equipments = new ArrayList<>(pontoGas.getEquipments());
        equipments.forEach(e -> e.setPontoGas(null));
        equipmentRepository.saveAll(equipments);

        pontoGasRepository.delete(pontoGas);

        log.info("Gas point hard deleted successfully with id: {}", id);
    }
}
