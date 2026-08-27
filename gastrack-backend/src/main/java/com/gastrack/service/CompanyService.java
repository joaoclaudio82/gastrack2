package com.gastrack.service;

import com.gastrack.dto.company.CompanyRequest;
import com.gastrack.dto.company.CompanyResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CompanyService {

    CompanyResponse create(CompanyRequest request);

    CompanyResponse findById(Long id);

    CompanyResponse findBySlug(String slug);

    Page<CompanyResponse> findAll(Pageable pageable);

    Page<CompanyResponse> findAllActive(String search, Pageable pageable);

    CompanyResponse update(Long id, CompanyRequest request);

    void deactivate(Long id);

    void activate(Long id);
}
