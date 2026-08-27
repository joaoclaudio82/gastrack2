package com.gastrack.service;

import com.gastrack.dto.equipmentkit.EquipmentKitRequest;
import com.gastrack.dto.equipmentkit.EquipmentKitResponse;
import com.gastrack.dto.equipmentkit.EquipmentKitStatusUpdateRequest;
import com.gastrack.dto.equipmentkit.SwapEspRequest;
import com.gastrack.dto.equipmentkit.SwapSensorRequest;
import com.gastrack.dto.kitinstallation.KitInstallRequest;
import com.gastrack.dto.kitinstallation.KitUninstallRequest;
import com.gastrack.model.KitStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EquipmentKitService {

    EquipmentKitResponse create(EquipmentKitRequest request);

    EquipmentKitResponse findById(Long id);

    Page<EquipmentKitResponse> findAll(Pageable pageable, KitStatus status, Long contractId);

    Page<EquipmentKitResponse> findByContract(Long contractId, Pageable pageable);

    Page<EquipmentKitResponse> findByCompanyAndStatus(Long companyId, KitStatus status, Pageable pageable);

    EquipmentKitResponse update(Long id, EquipmentKitRequest request);

    EquipmentKitResponse updateStatus(Long id, EquipmentKitStatusUpdateRequest request);

    EquipmentKitResponse installKit(Long id, KitInstallRequest request);

    EquipmentKitResponse uninstallKit(Long id, KitUninstallRequest request);

    EquipmentKitResponse swapEsp(Long id, SwapEspRequest request);

    EquipmentKitResponse swapSensor(Long id, SwapSensorRequest request);

    void deactivate(Long id);

    void activate(Long id);
}
