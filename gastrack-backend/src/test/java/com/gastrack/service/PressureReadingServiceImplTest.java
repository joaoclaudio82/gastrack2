package com.gastrack.service;

import com.gastrack.dto.pressure.PaginatedPressureResponse;
import com.gastrack.dto.pressure.PressureFilterParams;
import com.gastrack.dto.pressure.PressureReadingResponse;
import com.gastrack.exceptions.AccessDeniedException;
import com.gastrack.model.Address;
import com.gastrack.model.Company;
import com.gastrack.model.Contract;
import com.gastrack.model.Equipment;
import com.gastrack.model.EquipmentKit;
import com.gastrack.model.EquipmentType;
import com.gastrack.repository.EquipmentRepository;
import com.gastrack.repository.dynamodb.DynamoCursorCodec;
import com.gastrack.repository.dynamodb.DynamoPageResult;
import com.gastrack.repository.dynamodb.PressureReadingDynamoRepository;
import com.gastrack.service.impl.PressureReadingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PressureReadingServiceImplTest {

    @Mock
    private PressureReadingDynamoRepository pressureReadingDynamoRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private TenantSecurityService tenantSecurityService;

    @InjectMocks
    private PressureReadingServiceImpl pressureReadingService;

    private static final String DEVICE_ID = "4036EB1815AC";

    @BeforeEach
    void defaultToSuperAdmin() {
        // Existing pagination/mapping/enrichment tests are tenant-agnostic:
        // run them as SUPER_ADMIN so ownership scoping is skipped (no floor, no company check).
        // Security tests below override this per-case.
        lenient().when(tenantSecurityService.isSuperAdmin()).thenReturn(true);
    }

    // --- validation ---

    @Test
    void should_ThrowException_When_DeviceIdMissing() {
        PressureFilterParams filters = PressureFilterParams.builder()
                .deviceId(null)
                .build();

        assertThatThrownBy(() -> pressureReadingService.getPressureReadings(filters))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("deviceId is required");
    }

    @Test
    void should_ThrowException_When_InvalidTimestampRange() {
        PressureFilterParams filters = PressureFilterParams.builder()
                .deviceId(DEVICE_ID)
                .startTimestamp(2000L)
                .endTimestamp(1000L)
                .build();

        assertThatThrownBy(() -> pressureReadingService.getPressureReadings(filters))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("startTimestamp must be before endTimestamp");
    }

    // --- first page (no cursor) ---

    @Test
    void should_ReturnFirstPage_When_NoCursor() {
        PressureFilterParams filters = PressureFilterParams.builder()
                .deviceId(DEVICE_ID)
                .startTimestamp(1000L)
                .endTimestamp(2000L)
                .limit(2)
                .build();

        Map<String, AttributeValue> lastKey = new LinkedHashMap<>();
        lastKey.put("device_id", AttributeValue.builder().s(DEVICE_ID).build());
        lastKey.put("timestamp", AttributeValue.builder().n("1500").build());

        DynamoPageResult pageResult = DynamoPageResult.of(
                List.of(buildDynamoItem(DEVICE_ID, 1800L), buildDynamoItem(DEVICE_ID, 1700L)),
                lastKey
        );

        when(pressureReadingDynamoRepository.queryPage(eq(DEVICE_ID), isNull(), eq(1000L), eq(2000L), eq(2), isNull()))
                .thenReturn(pageResult);
        when(equipmentRepository.findActiveBySerialNumberIn(anyCollection()))
                .thenReturn(List.of());

        PaginatedPressureResponse response = pressureReadingService.getPressureReadings(filters);

        assertThat(response.getData()).hasSize(2);
        assertThat(response.getPagination().isHasMore()).isTrue();
        assertThat(response.getPagination().getNextCursor()).isNotNull().isNotBlank();
        assertThat(response.getPagination().getCount()).isEqualTo(2);
        assertThat(response.getPagination().getLimit()).isEqualTo(2);

        verify(pressureReadingDynamoRepository).queryPage(DEVICE_ID, null, 1000L, 2000L, 2, null);
    }

    // --- cursor page ---

    @Test
    void should_PassCursorToDynamo_When_CursorProvided() {
        Map<String, AttributeValue> cursorKey = new LinkedHashMap<>();
        cursorKey.put("device_id", AttributeValue.builder().s(DEVICE_ID).build());
        cursorKey.put("timestamp", AttributeValue.builder().n("1500").build());
        String encodedCursor = DynamoCursorCodec.encode(cursorKey);

        PressureFilterParams filters = PressureFilterParams.builder()
                .deviceId(DEVICE_ID)
                .startTimestamp(1000L)
                .endTimestamp(2000L)
                .limit(2)
                .cursor(encodedCursor)
                .build();

        DynamoPageResult pageResult = DynamoPageResult.of(
                List.of(buildDynamoItem(DEVICE_ID, 1400L)),
                Map.of()  // no more
        );

        when(pressureReadingDynamoRepository.queryPage(eq(DEVICE_ID), isNull(), eq(1000L), eq(2000L), eq(2), any()))
                .thenReturn(pageResult);
        when(equipmentRepository.findActiveBySerialNumberIn(anyCollection()))
                .thenReturn(List.of());

        PaginatedPressureResponse response = pressureReadingService.getPressureReadings(filters);

        assertThat(response.getData()).hasSize(1);
        assertThat(response.getPagination().isHasMore()).isFalse();
        assertThat(response.getPagination().getNextCursor()).isNull();

        // Verify cursor was decoded and passed correctly
        verify(pressureReadingDynamoRepository).queryPage(
                eq(DEVICE_ID), isNull(), eq(1000L), eq(2000L), eq(2),
                argThat(key -> key != null
                        && key.get("device_id").s().equals(DEVICE_ID)
                        && key.get("timestamp").n().equals("1500"))
        );
    }

    // --- empty results ---

    @Test
    void should_ReturnEmptyData_When_NoItems() {
        PressureFilterParams filters = PressureFilterParams.builder()
                .deviceId(DEVICE_ID)
                .startTimestamp(1000L)
                .endTimestamp(2000L)
                .build();

        when(pressureReadingDynamoRepository.queryPage(eq(DEVICE_ID), isNull(), anyLong(), anyLong(), anyInt(), isNull()))
                .thenReturn(DynamoPageResult.empty());

        PaginatedPressureResponse response = pressureReadingService.getPressureReadings(filters);

        assertThat(response.getData()).isEmpty();
        assertThat(response.getPagination().isHasMore()).isFalse();
        assertThat(response.getPagination().getNextCursor()).isNull();
        assertThat(response.getPagination().getCount()).isZero();

        // Should NOT call equipment repository when no readings
        verifyNoInteractions(equipmentRepository);
    }

    // --- limit capping ---

    @Test
    void should_CapLimitAt500_When_LimitExceedsMax() {
        PressureFilterParams filters = PressureFilterParams.builder()
                .deviceId(DEVICE_ID)
                .startTimestamp(1000L)
                .endTimestamp(2000L)
                .limit(9999)
                .build();

        when(pressureReadingDynamoRepository.queryPage(eq(DEVICE_ID), isNull(), anyLong(), anyLong(), eq(500), isNull()))
                .thenReturn(DynamoPageResult.empty());

        pressureReadingService.getPressureReadings(filters);

        verify(pressureReadingDynamoRepository).queryPage(DEVICE_ID, null, 1000L, 2000L, 500, null);
    }

    // --- enrichment ---

    @Test
    void should_EnrichReadings_When_EquipmentFound() {
        PressureFilterParams filters = PressureFilterParams.builder()
                .deviceId(DEVICE_ID)
                .startTimestamp(1000L)
                .endTimestamp(2000L)
                .limit(10)
                .build();

        DynamoPageResult pageResult = DynamoPageResult.of(
                List.of(buildDynamoItem(DEVICE_ID, 1800L)),
                Map.of()
        );

        Company company = Company.builder().id(1L).name("Acme Corp").build();
        Address address = Address.builder().id(10L).name("Main Office").company(company).build();
        EquipmentKit kit = EquipmentKit.builder().id(100L).kitCode("KIT-001").address(address).build();
        EquipmentType esp32Type = EquipmentType.builder().id(5L).name("ESP32").build();
        Equipment equipment = Equipment.builder()
                .id(200L)
                .serialNumber(DEVICE_ID)
                .equipmentType(esp32Type)
                .equipmentKit(kit)
                .build();

        when(pressureReadingDynamoRepository.queryPage(eq(DEVICE_ID), isNull(), anyLong(), anyLong(), anyInt(), isNull()))
                .thenReturn(pageResult);
        when(equipmentRepository.findActiveBySerialNumberIn(anyCollection()))
                .thenReturn(List.of(equipment));

        PaginatedPressureResponse response = pressureReadingService.getPressureReadings(filters);

        assertThat(response.getData()).hasSize(1);
        PressureReadingResponse reading = response.getData().get(0);
        assertThat(reading.getEquipmentId()).isEqualTo(200L);
        assertThat(reading.getEquipmentSerial()).isEqualTo(DEVICE_ID);
        assertThat(reading.getKitId()).isEqualTo(100L);
        assertThat(reading.getKitCode()).isEqualTo("KIT-001");
        assertThat(reading.getAddressId()).isEqualTo(10L);
        assertThat(reading.getAddressName()).isEqualTo("Main Office");
        assertThat(reading.getCompanyId()).isEqualTo(1L);
        assertThat(reading.getCompanyName()).isEqualTo("Acme Corp");
    }

    @Test
    void should_NotEnrich_When_EquipmentNotFound() {
        PressureFilterParams filters = PressureFilterParams.builder()
                .deviceId(DEVICE_ID)
                .startTimestamp(1000L)
                .endTimestamp(2000L)
                .limit(10)
                .build();

        DynamoPageResult pageResult = DynamoPageResult.of(
                List.of(buildDynamoItem(DEVICE_ID, 1800L)),
                Map.of()
        );

        when(pressureReadingDynamoRepository.queryPage(eq(DEVICE_ID), isNull(), anyLong(), anyLong(), anyInt(), isNull()))
                .thenReturn(pageResult);
        when(equipmentRepository.findActiveBySerialNumberIn(anyCollection()))
                .thenReturn(List.of());

        PaginatedPressureResponse response = pressureReadingService.getPressureReadings(filters);

        PressureReadingResponse reading = response.getData().get(0);
        assertThat(reading.getDeviceId()).isEqualTo(DEVICE_ID);
        assertThat(reading.getEquipmentId()).isNull();
        assertThat(reading.getKitId()).isNull();
        assertThat(reading.getCompanyId()).isNull();
    }

    @Test
    void should_SkipEnrichment_When_EquipmentIsNotAsp() {
        PressureFilterParams filters = PressureFilterParams.builder()
                .deviceId(DEVICE_ID)
                .startTimestamp(1000L)
                .endTimestamp(2000L)
                .limit(10)
                .build();

        DynamoPageResult pageResult = DynamoPageResult.of(
                List.of(buildDynamoItem(DEVICE_ID, 1800L)),
                Map.of()
        );

        EquipmentType nonAspType = EquipmentType.builder().id(5L).name("CYLINDER").build();
        Equipment nonAspEquipment = Equipment.builder()
                .id(300L)
                .serialNumber(DEVICE_ID)
                .equipmentType(nonAspType)
                .build();

        when(pressureReadingDynamoRepository.queryPage(eq(DEVICE_ID), isNull(), anyLong(), anyLong(), anyInt(), isNull()))
                .thenReturn(pageResult);
        when(equipmentRepository.findActiveBySerialNumberIn(anyCollection()))
                .thenReturn(List.of(nonAspEquipment));

        PaginatedPressureResponse response = pressureReadingService.getPressureReadings(filters);

        PressureReadingResponse reading = response.getData().get(0);
        assertThat(reading.getEquipmentId()).isNull();
    }

    @Test
    void should_HandlePartialEnrichment_When_KitIsNull() {
        PressureFilterParams filters = PressureFilterParams.builder()
                .deviceId(DEVICE_ID)
                .startTimestamp(1000L)
                .endTimestamp(2000L)
                .limit(10)
                .build();

        DynamoPageResult pageResult = DynamoPageResult.of(
                List.of(buildDynamoItem(DEVICE_ID, 1800L)),
                Map.of()
        );

        EquipmentType esp32Type = EquipmentType.builder().id(5L).name("ESP32").build();
        Equipment equipment = Equipment.builder()
                .id(200L)
                .serialNumber(DEVICE_ID)
                .equipmentType(esp32Type)
                .equipmentKit(null)  // no kit
                .build();

        when(pressureReadingDynamoRepository.queryPage(eq(DEVICE_ID), isNull(), anyLong(), anyLong(), anyInt(), isNull()))
                .thenReturn(pageResult);
        when(equipmentRepository.findActiveBySerialNumberIn(anyCollection()))
                .thenReturn(List.of(equipment));

        PaginatedPressureResponse response = pressureReadingService.getPressureReadings(filters);

        PressureReadingResponse reading = response.getData().get(0);
        assertThat(reading.getEquipmentId()).isEqualTo(200L);
        assertThat(reading.getKitId()).isNull();
        assertThat(reading.getAddressId()).isNull();
        assertThat(reading.getCompanyId()).isNull();
    }

    // --- mapping ---

    @Test
    void should_MapDynamoItemCorrectly() {
        PressureFilterParams filters = PressureFilterParams.builder()
                .deviceId(DEVICE_ID)
                .startTimestamp(1000L)
                .endTimestamp(2000L)
                .limit(10)
                .build();

        Map<String, AttributeValue> item = new LinkedHashMap<>();
        item.put("device_id", AttributeValue.builder().s(DEVICE_ID).build());
        item.put("datetime", AttributeValue.builder().s("17/02/2026 12:21:28").build());
        item.put("Pressao_bar", AttributeValue.builder().n("163.6752").build());
        item.put("ADC", AttributeValue.builder().n("2681").build());
        item.put("timestamp", AttributeValue.builder().n("1771330888").build());

        DynamoPageResult pageResult = DynamoPageResult.of(List.of(item), Map.of());

        when(pressureReadingDynamoRepository.queryPage(eq(DEVICE_ID), isNull(), anyLong(), anyLong(), anyInt(), isNull()))
                .thenReturn(pageResult);
        when(equipmentRepository.findActiveBySerialNumberIn(anyCollection()))
                .thenReturn(List.of());

        PaginatedPressureResponse response = pressureReadingService.getPressureReadings(filters);

        PressureReadingResponse reading = response.getData().get(0);
        assertThat(reading.getDeviceId()).isEqualTo(DEVICE_ID);
        assertThat(reading.getDatetime()).isEqualTo("17/02/2026 12:21:28");
        assertThat(reading.getPressureBar()).isEqualTo(163.6752);
        assertThat(reading.getAdc()).isEqualTo(2681);
        assertThat(reading.getTimestamp()).isEqualTo(1771330888L);
    }

    @Test
    void should_HandleNullAttributes_When_MappingDynamoItem() {
        PressureFilterParams filters = PressureFilterParams.builder()
                .deviceId(DEVICE_ID)
                .startTimestamp(1000L)
                .endTimestamp(2000L)
                .limit(10)
                .build();

        // Minimal item - only device_id
        Map<String, AttributeValue> item = Map.of(
                "device_id", AttributeValue.builder().s(DEVICE_ID).build()
        );

        DynamoPageResult pageResult = DynamoPageResult.of(List.of(item), Map.of());

        when(pressureReadingDynamoRepository.queryPage(eq(DEVICE_ID), isNull(), anyLong(), anyLong(), anyInt(), isNull()))
                .thenReturn(pageResult);
        when(equipmentRepository.findActiveBySerialNumberIn(anyCollection()))
                .thenReturn(List.of());

        PaginatedPressureResponse response = pressureReadingService.getPressureReadings(filters);

        PressureReadingResponse reading = response.getData().get(0);
        assertThat(reading.getDeviceId()).isEqualTo(DEVICE_ID);
        assertThat(reading.getDatetime()).isNull();
        assertThat(reading.getPressureBar()).isNull();
        assertThat(reading.getAdc()).isNull();
        assertThat(reading.getTimestamp()).isNull();
    }

    // --- tenant ownership scoping (Fatia 4a) ---

    @Test
    void should_DenyAccess_When_AdminRequestsDeviceOfAnotherCompany() {
        PressureFilterParams filters = PressureFilterParams.builder()
                .deviceId(DEVICE_ID)
                .startTimestamp(1_600_000_000L)
                .endTimestamp(1_800_000_000L)
                .build();

        when(tenantSecurityService.isSuperAdmin()).thenReturn(false);
        when(tenantSecurityService.getCurrentCompanyIdOrNull()).thenReturn(1L); // company A
        when(equipmentRepository.findActiveWithOwnerBySerialNumber(DEVICE_ID))
                .thenReturn(List.of(buildEspOwnedBy(2L, LocalDate.of(2026, 1, 1)))); // device of company B

        assertThatThrownBy(() -> pressureReadingService.getPressureReadings(filters))
                .isInstanceOf(AccessDeniedException.class);

        verifyNoInteractions(pressureReadingDynamoRepository);
    }

    @Test
    void should_DenyAccess_When_DeviceNotRegistered_AndNotSuperAdmin() {
        PressureFilterParams filters = PressureFilterParams.builder()
                .deviceId(DEVICE_ID)
                .startTimestamp(1_600_000_000L)
                .endTimestamp(1_800_000_000L)
                .build();

        when(tenantSecurityService.isSuperAdmin()).thenReturn(false);
        when(equipmentRepository.findActiveWithOwnerBySerialNumber(DEVICE_ID))
                .thenReturn(List.of()); // not registered

        assertThatThrownBy(() -> pressureReadingService.getPressureReadings(filters))
                .isInstanceOf(AccessDeniedException.class);

        verifyNoInteractions(pressureReadingDynamoRepository);
    }

    @Test
    void should_AllowAndLowerBoundStart_When_AdminRequestsOwnCompanyDevice() {
        LocalDate installedOn = LocalDate.of(2026, 2, 1);
        long possessionFloor = installedOn.atStartOfDay(ZoneOffset.UTC).toEpochSecond();
        long requestedStart = 1_600_000_000L; // 2020 - older than possession, must be raised

        PressureFilterParams filters = PressureFilterParams.builder()
                .deviceId(DEVICE_ID)
                .startTimestamp(requestedStart)
                .endTimestamp(1_800_000_000L)
                .build();

        when(tenantSecurityService.isSuperAdmin()).thenReturn(false);
        when(tenantSecurityService.getCurrentCompanyIdOrNull()).thenReturn(1L);
        when(equipmentRepository.findActiveWithOwnerBySerialNumber(DEVICE_ID))
                .thenReturn(List.of(buildEspOwnedBy(1L, installedOn))); // own company
        when(pressureReadingDynamoRepository.queryPage(eq(DEVICE_ID), isNull(), anyLong(), anyLong(), anyInt(), isNull()))
                .thenReturn(DynamoPageResult.empty());

        pressureReadingService.getPressureReadings(filters);

        ArgumentCaptor<Long> startCaptor = ArgumentCaptor.forClass(Long.class);
        verify(pressureReadingDynamoRepository).queryPage(
                eq(DEVICE_ID), isNull(), startCaptor.capture(), anyLong(), anyInt(), isNull());
        assertThat(startCaptor.getValue()).isEqualTo(possessionFloor);
        assertThat(startCaptor.getValue()).isGreaterThan(requestedStart);
    }

    @Test
    void should_AllowAllWithoutBound_When_SuperAdmin() {
        long requestedStart = 1000L;
        PressureFilterParams filters = PressureFilterParams.builder()
                .deviceId(DEVICE_ID)
                .startTimestamp(requestedStart)
                .endTimestamp(2000L)
                .build();

        when(tenantSecurityService.isSuperAdmin()).thenReturn(true);
        when(pressureReadingDynamoRepository.queryPage(eq(DEVICE_ID), isNull(), anyLong(), anyLong(), anyInt(), isNull()))
                .thenReturn(DynamoPageResult.empty());

        pressureReadingService.getPressureReadings(filters);

        // Super admin: no ownership lookup, no floor - queried with the exact requested start
        verify(pressureReadingDynamoRepository).queryPage(DEVICE_ID, null, requestedStart, 2000L, 50, null);
        verify(equipmentRepository, never()).findActiveWithOwnerBySerialNumber(anyString());
    }

    // --- helpers ---

    private Equipment buildEspOwnedBy(Long companyId, LocalDate installationDate) {
        Company company = Company.builder().id(companyId).name("Company " + companyId).build();
        Contract contract = Contract.builder().company(company).build();
        EquipmentKit kit = EquipmentKit.builder()
                .id(100L)
                .kitCode("KIT-" + companyId)
                .contract(contract)
                .installationDate(installationDate)
                .build();
        EquipmentType esp32Type = EquipmentType.builder().id(5L).name("ESP32").build();
        return Equipment.builder()
                .id(200L)
                .serialNumber(DEVICE_ID)
                .equipmentType(esp32Type)
                .equipmentKit(kit)
                .build();
    }

    private Map<String, AttributeValue> buildDynamoItem(String deviceId, long timestamp) {
        Map<String, AttributeValue> item = new LinkedHashMap<>();
        item.put("device_id", AttributeValue.builder().s(deviceId).build());
        item.put("timestamp", AttributeValue.builder().n(Long.toString(timestamp)).build());
        item.put("datetime", AttributeValue.builder().s("17/02/2026 12:00:00").build());
        item.put("Pressao_bar", AttributeValue.builder().n("10.5").build());
        item.put("ADC", AttributeValue.builder().n("100").build());
        return item;
    }
}
