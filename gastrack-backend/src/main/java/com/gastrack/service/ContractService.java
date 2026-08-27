package com.gastrack.service;

import com.gastrack.dto.contract.ContractAddressResponse;
import com.gastrack.dto.contract.ContractAddressesUpdateRequest;
import com.gastrack.dto.contract.ContractRequest;
import com.gastrack.dto.contract.ContractResponse;
import com.gastrack.dto.contract.ContractStatusUpdateRequest;
import com.gastrack.model.ContractStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ContractService {

    ContractResponse create(ContractRequest request);

    ContractResponse findById(Long id);

    Page<ContractResponse> findAll(Pageable pageable, ContractStatus status, String search);

    Page<ContractResponse> findByCompany(Long companyId, Pageable pageable);

    Page<ContractResponse> findByCompanyAndStatus(Long companyId, ContractStatus status, Pageable pageable);

    ContractResponse update(Long id, ContractRequest request);

    ContractResponse updateStatus(Long id, ContractStatusUpdateRequest request);

    ContractResponse updateAddresses(Long id, ContractAddressesUpdateRequest request);

    java.util.List<ContractAddressResponse> getAllowedAddresses(Long id);

    void deactivate(Long id);

    void activate(Long id);
}
