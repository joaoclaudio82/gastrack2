package com.gastrack.service.impl;

import com.gastrack.dto.city.CityRequest;
import com.gastrack.dto.city.CityResponse;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.CityMapper;
import com.gastrack.model.City;
import com.gastrack.model.State;
import com.gastrack.repository.CityRepository;
import com.gastrack.repository.StateRepository;
import com.gastrack.service.CityService;
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
public class CityServiceImpl implements CityService {

    private final CityRepository cityRepository;
    private final StateRepository stateRepository;
    private final CityMapper cityMapper;

    @Override
    @Transactional
    public CityResponse create(CityRequest request) {
        log.info("Creating city with code: {}", request.code());

        if (cityRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("City with code " + request.code() + " already exists");
        }

        State state = stateRepository.findById(request.stateId())
            .orElseThrow(() -> new ResourceNotFoundException("State", "id", request.stateId()));

        City city = cityMapper.toEntity(request);
        city.setState(state);
        City saved = cityRepository.save(city);

        log.info("City created successfully with id: {}", saved.getId());
        return cityMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CityResponse findById(Long id) {
        City city = cityRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("City", "id", id));
        return cityMapper.toResponse(city);
    }

    @Override
    @Transactional(readOnly = true)
    public CityResponse findByCode(String code) {
        City city = cityRepository.findByCode(code)
            .orElseThrow(() -> new ResourceNotFoundException("City", "code", code));
        return cityMapper.toResponse(city);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CityResponse> findAll(Pageable pageable) {
        return cityRepository.findByActive(true, pageable)
            .map(cityMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CityResponse> findAllActive() {
        return cityRepository.findByActive(true).stream()
            .map(cityMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CityResponse> findByStateId(Long stateId) {
        return cityRepository.findByStateIdAndActive(stateId, true).stream()
            .map(cityMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CityResponse> findByStateId(Long stateId, Pageable pageable) {
        return cityRepository.findByStateId(stateId, pageable)
            .map(cityMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CityResponse> searchByName(String name) {
        return cityRepository.findByNameContainingIgnoreCase(name).stream()
            .map(cityMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CityResponse> searchByNameInState(Long stateId, String name) {
        return cityRepository.findByStateIdAndNameContainingIgnoreCase(stateId, name).stream()
            .map(cityMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional
    public CityResponse update(Long id, CityRequest request) {
        log.info("Updating city with id: {}", id);

        City city = cityRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("City", "id", id));

        if (!city.getCode().equals(request.code()) && cityRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("City with code " + request.code() + " already exists");
        }

        if (!city.getState().getId().equals(request.stateId())) {
            State newState = stateRepository.findById(request.stateId())
                .orElseThrow(() -> new ResourceNotFoundException("State", "id", request.stateId()));
            city.setState(newState);
        }

        cityMapper.updateEntity(request, city);
        City saved = cityRepository.save(city);

        log.info("City updated successfully with id: {}", saved.getId());
        return cityMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        log.info("Deactivating city with id: {}", id);

        City city = cityRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("City", "id", id));

        city.setActive(false);
        cityRepository.save(city);

        log.info("City deactivated successfully with id: {}", id);
    }

    @Override
    @Transactional
    public void activate(Long id) {
        log.info("Activating city with id: {}", id);

        City city = cityRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("City", "id", id));

        city.setActive(true);
        cityRepository.save(city);

        log.info("City activated successfully with id: {}", id);
    }
}
