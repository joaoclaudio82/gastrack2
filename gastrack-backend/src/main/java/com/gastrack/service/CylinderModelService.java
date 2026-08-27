package com.gastrack.service;

import com.gastrack.dto.cylindermodel.CylinderModelRequest;
import com.gastrack.dto.cylindermodel.CylinderModelResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CylinderModelService {

    CylinderModelResponse create(CylinderModelRequest request);

    CylinderModelResponse update(Long id, CylinderModelRequest request);

    Page<CylinderModelResponse> findAll(Pageable pageable);

    CylinderModelResponse findById(Long id);

    void deactivate(Long id);
}
