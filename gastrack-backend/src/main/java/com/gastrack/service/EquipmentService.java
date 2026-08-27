package com.gastrack.service;

import com.gastrack.dto.equipment.EquipmentAssignRequest;
import com.gastrack.dto.equipment.EquipmentBatchAssignRequest;
import com.gastrack.dto.equipment.EquipmentBatchAssignResponse;
import com.gastrack.dto.equipment.EquipmentRequest;
import com.gastrack.dto.equipment.EquipmentResponse;
import com.gastrack.dto.equipment.EquipmentTransferRequest;
import com.gastrack.dto.equipment.SensorOptionResponse;
import com.gastrack.model.EquipmentCondition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EquipmentService {

    EquipmentResponse create(EquipmentRequest request);

    EquipmentResponse findById(Long id);

    Page<EquipmentResponse> findAll(
        Pageable pageable,
        String assignment,
        EquipmentCondition condition,
        Long typeId,
        Long kitId,
        Long companyId
    );

    Page<EquipmentResponse> findUnassigned(Pageable pageable);

    Page<EquipmentResponse> findByKit(Long kitId, Pageable pageable);

    Page<EquipmentResponse> findByType(Long typeId, Pageable pageable);

    java.util.List<SensorOptionResponse> getSensorOptionsForKit(Long kitId);

    EquipmentResponse update(Long id, EquipmentRequest request);

    EquipmentResponse assignToKit(Long id, EquipmentAssignRequest request);

    EquipmentBatchAssignResponse assignMultipleToKit(EquipmentBatchAssignRequest request);

    EquipmentResponse removeFromKit(Long id);

    EquipmentResponse transfer(Long id, EquipmentTransferRequest request);

    void deactivate(Long id);

    void activate(Long id);
}
