package com.gastrack.service.impl;

import com.gastrack.dto.refill.RefillEventResponse;
import com.gastrack.dto.refill.RefillRequest;
import com.gastrack.exceptions.ConflictException;
import com.gastrack.exceptions.BusinessException;
import com.gastrack.exceptions.ErrorCodes;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.RefillEventMapper;
import com.gastrack.model.Cylinder;
import com.gastrack.model.CylinderModel;
import com.gastrack.model.PontoGas;
import com.gastrack.model.RefillEvent;
import com.gastrack.model.RefillSource;
import com.gastrack.repository.CylinderModelRepository;
import com.gastrack.repository.CylinderRepository;
import com.gastrack.repository.PontoGasRepository;
import com.gastrack.repository.RefillEventRepository;
import com.gastrack.service.RefillService;
import com.gastrack.service.TenantSecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefillServiceImpl implements RefillService {

    private final RefillEventRepository refillEventRepository;
    private final PontoGasRepository pontoGasRepository;
    private final CylinderRepository cylinderRepository;
    private final CylinderModelRepository cylinderModelRepository;
    private final RefillEventMapper refillEventMapper;
    private final com.gastrack.service.GasLinePolicy gasLinePolicy;
    private final TenantSecurityService tenantSecurityService;

    @Override
    @Transactional
    public RefillEventResponse registerRefill(Long gasPointId, RefillRequest request) {
        log.info("Registering MANUAL refill for gas point {} with serial {}", gasPointId, request.serialNumber());

        PontoGas gasPoint = pontoGasRepository.findById(gasPointId)
            .orElseThrow(() -> new ResourceNotFoundException("PontoGas", "id", gasPointId));

        tenantSecurityService.validateCompanyAccess(gasPoint.getAddress().getCompany().getId());

        CylinderModel model = cylinderModelRepository.findById(request.cylinderModelId())
            .orElseThrow(() -> new ResourceNotFoundException("CylinderModel", "id", request.cylinderModelId()));

        if (cylinderRepository.existsBySerialNumber(request.serialNumber())) {
            throw new ConflictException("Cylinder with this Serial number already exists",
                    ErrorCodes.CYLINDER_SERIAL_DUPLICATE);
        }

        // Mesma invariante do cadastro: o casco novo tem que carregar o gás da linha.
        gasLinePolicy.validateGasTypeMatchesLine(gasPoint, model, request.outgoingCylinderId());

        retireOutgoing(gasPointId, request.outgoingCylinderId());

        Cylinder cylinder = new Cylinder();
        cylinder.setCylinderModel(model);
        // company é NOT NULL desde a V45; o dono é a empresa do endereço do ponto.
        cylinder.setCompany(gasPoint.getAddress().getCompany());
        cylinder.setSerialNumber(request.serialNumber());
        cylinder.setActive(true);
        // Entra fornecendo: um casco novo fechado tiraria volume da linha logo após a troca.
        cylinder.setConnected(true);
        // Por último: setPontoGas espelha o endereço do ponto no cilindro.
        cylinder.setPontoGas(gasPoint);
        cylinder = cylinderRepository.save(cylinder);

        RefillEvent event = refillEventRepository.save(RefillEvent.builder()
            .gasPoint(gasPoint)
            .detectedAt(LocalDateTime.now())
            .source(RefillSource.MANUAL)
            .cylinder(cylinder)
            .build());

        log.info("MANUAL refill recorded (event {}, cylinder {}) for gas point {}",
            event.getId(), cylinder.getId(), gasPointId);
        return refillEventMapper.toResponse(event);
    }

    /**
     * Aposenta somente o casco que saiu. Um sensor mede a saída combinada do manifold, então
     * o sistema não deduz qual botijão foi trocado — quem informa é o cliente. Aposentar todos
     * (comportamento anterior) derrubava um banco de 3 × 50 L para 50 L a cada troca.
     */
    private void retireOutgoing(Long gasPointId, Long outgoingCylinderId) {
        List<Cylinder> current = cylinderRepository.findByPontoGasIdAndActiveTrue(gasPointId);
        if (current.isEmpty()) {
            return;
        }
        if (outgoingCylinderId == null) {
            throw new BusinessException(
                "This gas point already has cylinders; inform which cylinder was replaced");
        }
        Cylinder outgoing = current.stream()
            .filter(c -> outgoingCylinderId.equals(c.getId()))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException(
                "Cylinder", "id on this gas point", outgoingCylinderId));

        outgoing.setActive(false);
        cylinderRepository.saveAll(List.of(outgoing));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RefillEventResponse> findByGasPoint(Long gasPointId) {
        PontoGas gasPoint = pontoGasRepository.findById(gasPointId)
            .orElseThrow(() -> new ResourceNotFoundException("PontoGas", "id", gasPointId));

        tenantSecurityService.validateCompanyAccess(gasPoint.getAddress().getCompany().getId());

        return refillEventRepository.findByGasPointIdOrderByDetectedAtDesc(gasPointId).stream()
            .map(refillEventMapper::toResponse)
            .toList();
    }
}
