package com.gastrack.service;

import com.gastrack.dto.city.CityRequest;
import com.gastrack.dto.city.CityResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CityService {

    CityResponse create(CityRequest request);

    CityResponse findById(Long id);

    CityResponse findByCode(String code);

    Page<CityResponse> findAll(Pageable pageable);

    List<CityResponse> findAllActive();

    List<CityResponse> findByStateId(Long stateId);

    Page<CityResponse> findByStateId(Long stateId, Pageable pageable);

    List<CityResponse> searchByName(String name);

    List<CityResponse> searchByNameInState(Long stateId, String name);

    CityResponse update(Long id, CityRequest request);

    void deactivate(Long id);

    void activate(Long id);
}
