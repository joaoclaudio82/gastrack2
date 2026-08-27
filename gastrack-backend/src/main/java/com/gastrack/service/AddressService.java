package com.gastrack.service;

import com.gastrack.dto.address.AddressRequest;
import com.gastrack.dto.address.AddressResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AddressService {

    AddressResponse create(AddressRequest request);

    AddressResponse findById(Long id);

    Page<AddressResponse> findAll(Boolean active, Pageable pageable);

    Page<AddressResponse> findByCompanyId(Long companyId, Pageable pageable);

    AddressResponse update(Long id, AddressRequest request);

    /**
     * Soft-deactivate an address (keep record, set active = false).
     */
    void deactivate(Long id);

    /**
     * Reactivate a previously deactivated address.
     */
    void activate(Long id);

    /**
     * Hard delete an address so it no longer appears in listings.
     */
    void delete(Long id);
}
