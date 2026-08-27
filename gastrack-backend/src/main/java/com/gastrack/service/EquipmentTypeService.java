package com.gastrack.service;

import com.gastrack.dto.equipmenttype.EquipmentTypeRequest;
import com.gastrack.dto.equipmenttype.EquipmentTypeResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EquipmentTypeService {

    EquipmentTypeResponse create(EquipmentTypeRequest request);

    EquipmentTypeResponse findById(Long id);

    Page<EquipmentTypeResponse> findAll(Pageable pageable);

    Page<EquipmentTypeResponse> findAllActive(Pageable pageable);

    Page<EquipmentTypeResponse> searchActive(String search, Pageable pageable);

    EquipmentTypeResponse update(Long id, EquipmentTypeRequest request);

    void deactivate(Long id);

    void activate(Long id);
}
