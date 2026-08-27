package com.gastrack.service.impl;

import com.gastrack.dto.state.StateRequest;
import com.gastrack.dto.state.StateResponse;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.StateMapper;
import com.gastrack.model.Country;
import com.gastrack.model.State;
import com.gastrack.repository.CountryRepository;
import com.gastrack.repository.StateRepository;
import com.gastrack.service.StateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class StateServiceImpl implements StateService {

    private final StateRepository stateRepository;
    private final CountryRepository countryRepository;
    private final StateMapper stateMapper;

    @Override
    @Transactional
    public StateResponse create(StateRequest request) {
        log.info("Creating state with code: {}", request.code());

        if (stateRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("State with code " + request.code() + " already exists");
        }

        Country country = countryRepository.findById(request.countryId())
            .orElseThrow(() -> new ResourceNotFoundException("Country", "id", request.countryId()));

        State state = stateMapper.toEntity(request);
        state.setCountry(country);
        State saved = stateRepository.save(state);

        log.info("State created successfully with id: {}", saved.getId());
        return stateMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public StateResponse findById(Long id) {
        State state = stateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("State", "id", id));
        return stateMapper.toResponse(state);
    }

    @Override
    @Transactional(readOnly = true)
    public StateResponse findByCode(String code) {
        State state = stateRepository.findByCode(code)
            .orElseThrow(() -> new ResourceNotFoundException("State", "code", code));
        return stateMapper.toResponse(state);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StateResponse> findAll() {
        return stateRepository.findAll().stream()
            .map(stateMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StateResponse> findAllActive() {
        return stateRepository.findByActive(true).stream()
            .map(stateMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StateResponse> findByCountryId(Long countryId) {
        return stateRepository.findByCountryIdAndActive(countryId, true).stream()
            .map(stateMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StateResponse> findByCountryId(Long countryId, Pageable pageable) {
        return stateRepository.findByCountryId(countryId, pageable)
            .map(stateMapper::toResponse);
    }

    @Override
    @Transactional
    public StateResponse update(Long id, StateRequest request) {
        log.info("Updating state with id: {}", id);

        State state = stateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("State", "id", id));

        if (!state.getCode().equals(request.code()) && stateRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("State with code " + request.code() + " already exists");
        }

        if (!state.getCountry().getId().equals(request.countryId())) {
            Country newCountry = countryRepository.findById(request.countryId())
                .orElseThrow(() -> new ResourceNotFoundException("Country", "id", request.countryId()));
            state.setCountry(newCountry);
        }

        stateMapper.updateEntity(request, state);
        State saved = stateRepository.save(state);

        log.info("State updated successfully with id: {}", saved.getId());
        return stateMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        log.info("Deactivating state with id: {}", id);

        State state = stateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("State", "id", id));

        state.setActive(false);
        stateRepository.save(state);

        log.info("State deactivated successfully with id: {}", id);
    }

    @Override
    @Transactional
    public void activate(Long id) {
        log.info("Activating state with id: {}", id);

        State state = stateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("State", "id", id));

        state.setActive(true);
        stateRepository.save(state);

        log.info("State activated successfully with id: {}", id);
    }
}
