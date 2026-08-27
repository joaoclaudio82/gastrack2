package com.gastrack.service;

import com.gastrack.dto.country.CountryRequest;
import com.gastrack.dto.country.CountryResponse;

import java.util.List;

public interface CountryService {

    CountryResponse create(CountryRequest request);

    CountryResponse findById(Long id);

    CountryResponse findByCode(String code);

    List<CountryResponse> findAll();

    List<CountryResponse> findAllActive();

    CountryResponse update(Long id, CountryRequest request);

    void deactivate(Long id);

    void activate(Long id);
}
