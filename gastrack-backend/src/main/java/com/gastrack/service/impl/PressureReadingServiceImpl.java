package com.gastrack.service.impl;

import com.gastrack.configuration.CacheConfiguration;
import com.gastrack.dto.pressure.PaginatedPressureResponse;
import com.gastrack.dto.pressure.PressureFilterParams;
import com.gastrack.dto.pressure.PressureReadingResponse;
import com.gastrack.model.Address;
import com.gastrack.model.Company;
import com.gastrack.model.Equipment;
import com.gastrack.model.EquipmentKit;
import com.gastrack.model.EquipmentType;
import com.gastrack.repository.EquipmentRepository;
import com.gastrack.repository.dynamodb.DynamoCursorCodec;
import com.gastrack.repository.dynamodb.DynamoPageResult;
import com.gastrack.repository.dynamodb.PressureReadingDynamoRepository;
import com.gastrack.exceptions.AccessDeniedException;
import com.gastrack.service.PressureReadingService;
import com.gastrack.service.TenantSecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PressureReadingServiceImpl implements PressureReadingService {

    private static final String ESP32_TYPE_NAME = EquipmentType.ESP32_TYPE_NAME;

    private final PressureReadingDynamoRepository pressureReadingDynamoRepository;
    private final EquipmentRepository equipmentRepository;
    private final TenantSecurityService tenantSecurityService;

    @Override
    @Transactional(readOnly = true)
    public PaginatedPressureResponse getPressureReadings(PressureFilterParams filters) {
        filters.validate();

        int limit = filters.getLimitOrDefault();
        long endTs = filters.getEffectiveEndTimestamp();
        String deviceId = filters.getDeviceId();
        Integer sensorId = filters.getSensorId();

        // Fatia 4a: scope readings by ownership BEFORE touching Dynamo.
        // Returns the effective start timestamp, raised to the possession floor for non-super users.
        long startTs = scopeByTenantOwnership(deviceId, filters.getEffectiveStartTimestamp());

        Map<String, AttributeValue> exclusiveStartKey = DynamoCursorCodec.decode(filters.getCursor());

        DynamoPageResult dynamoPage = pressureReadingDynamoRepository.queryPage(
                deviceId, sensorId, startTs, endTs, limit, exclusiveStartKey);

        List<PressureReadingResponse> readings = dynamoPage.items().stream()
                .map(this::mapToResponse)
                .toList();

        List<PressureReadingResponse> enriched = enrichWithEquipmentInfo(readings);

        String nextCursor = DynamoCursorCodec.encode(dynamoPage.lastEvaluatedKey());

        return PaginatedPressureResponse.of(enriched, limit, dynamoPage.hasMore(), nextCursor);
    }

    /**
     * Fatia 4a - ownership scoping. SUPER_ADMIN (operadora) sees any device with no floor.
     * Everyone else may only read devices owned by their own company, and never below the
     * possession floor (so a reused ESP never leaks the previous owner's readings).
     *
     * @return the effective start timestamp to query Dynamo with (raised to the possession floor for non-super users)
     * @throws AccessDeniedException if a non-super user requests an unregistered device or one of another company
     */
    private long scopeByTenantOwnership(String deviceId, long requestedStartTs) {
        if (tenantSecurityService.isSuperAdmin()) {
            return requestedStartTs;
        }

        Equipment esp = equipmentRepository.findActiveWithOwnerBySerialNumber(deviceId).stream()
                .filter(e -> ESP32_TYPE_NAME.equalsIgnoreCase(e.getEquipmentType().getName()))
                .findFirst()
                .orElse(null);

        EquipmentKit kit = esp != null ? esp.getEquipmentKit() : null;
        Company owner = kit != null ? kit.getCompany() : null;
        Long requesterCompanyId = tenantSecurityService.getCurrentCompanyIdOrNull();

        if (owner == null || requesterCompanyId == null || !requesterCompanyId.equals(owner.getId())) {
            log.warn("Access denied: company {} requested pressure of device {} owned by {}",
                    requesterCompanyId, deviceId, owner != null ? owner.getId() : "none");
            throw new AccessDeniedException("Access denied to this device's readings");
        }

        return Math.max(requestedStartTs, possessionStartEpoch(kit));
    }

    /**
     * Possession floor for the current owner. Source: kit.installationDate.
     * A reused ESP is reassigned to a NEW kit for the new owner, so THIS kit's installationDate
     * is exactly when the current owner took possession - already fetched, no extra query.
     * If null (kit still PENDING), no floor is applied.
     * ponytail: day-granularity LocalDate; upgrade path = latest KitInstallation(INSTALLED).operationDate for sub-day precision.
     */
    private long possessionStartEpoch(EquipmentKit kit) {
        LocalDate installedOn = kit.getInstallationDate();
        if (installedOn == null) {
            return Long.MIN_VALUE; // no floor
        }
        return installedOn.atStartOfDay(ZoneOffset.UTC).toEpochSecond();
    }

    private PressureReadingResponse mapToResponse(Map<String, AttributeValue> item) {
        return PressureReadingResponse.builder()
                .deviceId(getStringAttribute(item, "device_id"))
                .sensorId(getIntAttribute(item, "sensor_id"))
                .datetime(getStringAttribute(item, "datetime"))
                .pressureBar(getDoubleAttribute(item, "Pressao_bar"))
                .adc(getIntAttribute(item, "ADC"))
                .timestamp(getLongAttribute(item, "timestamp"))
                .build();
    }

    private String getStringAttribute(Map<String, AttributeValue> item, String key) {
        AttributeValue value = item.get(key);
        return value != null ? value.s() : null;
    }

    private Double getDoubleAttribute(Map<String, AttributeValue> item, String key) {
        AttributeValue value = item.get(key);
        return value != null && value.n() != null ? Double.parseDouble(value.n()) : null;
    }

    private Integer getIntAttribute(Map<String, AttributeValue> item, String key) {
        AttributeValue value = item.get(key);
        return value != null && value.n() != null ? Integer.parseInt(value.n()) : null;
    }

    private Long getLongAttribute(Map<String, AttributeValue> item, String key) {
        AttributeValue value = item.get(key);
        return value != null && value.n() != null ? Long.parseLong(value.n()) : null;
    }

    @Cacheable(
            value = CacheConfiguration.EQUIPMENT_ENRICHMENT_CACHE,
            key = "#deviceIds.hashCode()"
    )
    @Transactional(readOnly = true)
    public Map<String, Equipment> lookupEquipmentBySerialNumbers(Collection<String> deviceIds) {
        return equipmentRepository.findActiveBySerialNumberIn(deviceIds).stream()
                .filter(e -> ESP32_TYPE_NAME.equalsIgnoreCase(e.getEquipmentType().getName()))
                .collect(Collectors.toMap(Equipment::getSerialNumber, Function.identity(), (a, b) -> a));
    }

    private List<PressureReadingResponse> enrichWithEquipmentInfo(List<PressureReadingResponse> readings) {
        Set<String> deviceIds = readings.stream()
                .map(PressureReadingResponse::getDeviceId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (deviceIds.isEmpty()) {
            return readings;
        }

        Map<String, Equipment> esp32BySerial = lookupEquipmentBySerialNumbers(deviceIds);

        if (esp32BySerial.isEmpty()) {
            return readings;
        }

        return readings.stream()
                .map(reading -> enrichReading(reading, esp32BySerial))
                .toList();
    }

    private PressureReadingResponse enrichReading(PressureReadingResponse reading, Map<String, Equipment> esp32BySerial) {
        Equipment esp32 = esp32BySerial.get(reading.getDeviceId());
        if (esp32 == null) {
            return reading;
        }

        reading.setEquipmentId(esp32.getId());
        reading.setEquipmentSerial(esp32.getSerialNumber());

        enrichFromKit(reading, esp32.getEquipmentKit());
        return reading;
    }

    private void enrichFromKit(PressureReadingResponse reading, EquipmentKit kit) {
        if (kit == null) {
            return;
        }

        reading.setKitId(kit.getId());
        reading.setKitCode(kit.getKitCode());

        enrichFromAddress(reading, kit.getAddress());
    }

    private void enrichFromAddress(PressureReadingResponse reading, Address address) {
        if (address == null) {
            return;
        }

        reading.setAddressId(address.getId());
        reading.setAddressName(address.getName());

        enrichFromCompany(reading, address.getCompany());
    }

    private void enrichFromCompany(PressureReadingResponse reading, Company company) {
        if (company == null) {
            return;
        }

        reading.setCompanyId(company.getId());
        reading.setCompanyName(company.getName());
    }
}
