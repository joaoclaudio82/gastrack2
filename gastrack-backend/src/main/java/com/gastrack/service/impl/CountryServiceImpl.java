package com.gastrack.service.impl;

import com.gastrack.dto.country.CountryRequest;
import com.gastrack.dto.country.CountryResponse;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.CountryMapper;
import com.gastrack.model.Country;
import com.gastrack.repository.CountryRepository;
import com.gastrack.service.CountryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CountryServiceImpl implements CountryService {

    private final CountryRepository countryRepository;
    private final CountryMapper countryMapper;

    @Override
    @Transactional
    public CountryResponse create(CountryRequest request) {
        log.info("Creating country with code: {}", request.code());

        if (countryRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("Country with code " + request.code() + " already exists");
        }

        Country country = countryMapper.toEntity(request);
        Country saved = countryRepository.save(country);

        log.info("Country created successfully with id: {}", saved.getId());
        return countryMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CountryResponse findById(Long id) {
        Country country = countryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Country", "id", id));
        return countryMapper.toResponse(country);
    }

    @Override
    @Transactional(readOnly = true)
    public CountryResponse findByCode(String code) {
        Country country = countryRepository.findByCode(code)
            .orElseThrow(() -> new ResourceNotFoundException("Country", "code", code));
        return countryMapper.toResponse(country);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CountryResponse> findAll() {
        return countryRepository.findAll().stream()
            .map(countryMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CountryResponse> findAllActive() {
        return countryRepository.findByActive(true).stream()
            .map(countryMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional
    public CountryResponse update(Long id, CountryRequest request) {
        log.info("Updating country with id: {}", id);

        Country country = countryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Country", "id", id));

        if (!country.getCode().equals(request.code()) && countryRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("Country with code " + request.code() + " already exists");
        }

        countryMapper.updateEntity(request, country);
        Country saved = countryRepository.save(country);

        log.info("Country updated successfully with id: {}", saved.getId());
        return countryMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        log.info("Deactivating country with id: {}", id);

        Country country = countryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Country", "id", id));

        country.setActive(false);
        countryRepository.save(country);

        log.info("Country deactivated successfully with id: {}", id);
    }

    @Override
    @Transactional
    public void activate(Long id) {
        log.info("Activating country with id: {}", id);

        Country country = countryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Country", "id", id));

        country.setActive(true);
        countryRepository.save(country);

        log.info("Country activated successfully with id: {}", id);
    }
}
