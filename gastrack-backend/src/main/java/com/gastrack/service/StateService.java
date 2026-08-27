package com.gastrack.service;

import com.gastrack.dto.state.StateRequest;
import com.gastrack.dto.state.StateResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface StateService {

    StateResponse create(StateRequest request);

    StateResponse findById(Long id);

    StateResponse findByCode(String code);

    List<StateResponse> findAll();

    List<StateResponse> findAllActive();

    List<StateResponse> findByCountryId(Long countryId);

    Page<StateResponse> findByCountryId(Long countryId, Pageable pageable);

    StateResponse update(Long id, StateRequest request);

    void deactivate(Long id);

    void activate(Long id);
}
