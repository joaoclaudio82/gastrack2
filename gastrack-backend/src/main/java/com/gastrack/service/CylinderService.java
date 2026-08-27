package com.gastrack.service;

import com.gastrack.dto.cylinder.CylinderRequest;
import com.gastrack.dto.cylinder.CylinderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CylinderService {

    CylinderResponse create(CylinderRequest request);

    CylinderResponse findById(Long id);

    Page<CylinderResponse> findAll(Pageable pageable, String search, Long addressId, Long pontoGasId);

    Page<CylinderResponse> findByAddressId(Long addressId, Pageable pageable);

    CylinderResponse update(Long id, CylinderRequest request);

    void deactivate(Long id);

    void activate(Long id);
}
