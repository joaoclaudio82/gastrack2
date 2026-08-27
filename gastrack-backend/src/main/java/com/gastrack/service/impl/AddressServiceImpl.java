package com.gastrack.service.impl;

import com.gastrack.dto.address.AddressRequest;
import com.gastrack.dto.address.AddressResponse;
import com.gastrack.exceptions.BusinessException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.AddressMapper;
import com.gastrack.model.Address;
import com.gastrack.model.City;
import com.gastrack.model.Company;
import com.gastrack.model.Contract;
import com.gastrack.repository.AddressRepository;
import com.gastrack.repository.CityRepository;
import com.gastrack.repository.CompanyRepository;
import com.gastrack.repository.ContractRepository;
import com.gastrack.service.AddressService;
import com.gastrack.service.TenantSecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final CompanyRepository companyRepository;
    private final CityRepository cityRepository;
    private final ContractRepository contractRepository;
    private final AddressMapper addressMapper;
    private final TenantSecurityService tenantSecurityService;

    @Override
    @Transactional
    public AddressResponse create(AddressRequest request) {
        // Resolve companyId: use provided value or extract from JWT token
        final Long resolvedCompanyId;
        if (request.companyId() != null) {
            resolvedCompanyId = request.companyId();
        } else {
            resolvedCompanyId = tenantSecurityService.getCurrentCompanyIdOrNull();
            if (resolvedCompanyId == null) {
                throw new IllegalArgumentException("Company ID is required. Provide it in the request or ensure user has a company assigned.");
            }
        }

        log.info("Creating address for company id: {}", resolvedCompanyId);

        tenantSecurityService.validateCompanyAccess(resolvedCompanyId);

        Company company = companyRepository.findById(resolvedCompanyId)
            .orElseThrow(() -> new ResourceNotFoundException("Company", "id", resolvedCompanyId));

        City city = cityRepository.findById(request.cityId())
            .orElseThrow(() -> new ResourceNotFoundException("City", "id", request.cityId()));

        Address address = addressMapper.toEntity(request);
        address.setCompany(company);
        address.setCity(city);
        Address saved = addressRepository.save(address);

        if (request.contractIds() != null && !request.contractIds().isEmpty()) {
            linkAddressToContracts(saved, request.contractIds());
        }

        log.info("Address created successfully with id: {}", saved.getId());
        return addressMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AddressResponse findById(Long id) {
        Address address = addressRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Address", "id", id));

        tenantSecurityService.validateCompanyAccess(address.getCompany().getId());

        return addressMapper.toResponse(address);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AddressResponse> findAll(Boolean active, Pageable pageable) {
        if (tenantSecurityService.isSuperAdmin()) {
            if (active != null) {
                return addressRepository.findByActive(active, pageable)
                    .map(addressMapper::toResponse);
            }
            return addressRepository.findAll(pageable)
                .map(addressMapper::toResponse);
        }

        Long companyId = tenantSecurityService.requireCompanyContext();

        if (active != null) {
            return addressRepository.findByCompanyIdAndActive(companyId, active, pageable)
                .map(addressMapper::toResponse);
        }
        return addressRepository.findByCompanyId(companyId, pageable)
            .map(addressMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AddressResponse> findByCompanyId(Long companyId, Pageable pageable) {
        tenantSecurityService.validateCompanyAccess(companyId);

        return addressRepository.findByCompanyId(companyId, pageable)
            .map(addressMapper::toResponse);
    }

    @Override
    @Transactional
    public AddressResponse update(Long id, AddressRequest request) {
        log.info("Updating address with id: {}", id);

        Address address = addressRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Address", "id", id));

        tenantSecurityService.validateCompanyAccess(address.getCompany().getId());

        // Resolve companyId: use provided value or keep current company
        final Long targetCompanyId = request.companyId() != null
            ? request.companyId()
            : address.getCompany().getId();

        // If companyId changed, validate access to new company
        if (!address.getCompany().getId().equals(targetCompanyId)) {
            tenantSecurityService.validateCompanyAccess(targetCompanyId);
            Company newCompany = companyRepository.findById(targetCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", "id", targetCompanyId));
            address.setCompany(newCompany);
        }

        // If cityId changed, validate and update city
        if (!address.getCity().getId().equals(request.cityId())) {
            City newCity = cityRepository.findById(request.cityId())
                .orElseThrow(() -> new ResourceNotFoundException("City", "id", request.cityId()));
            address.setCity(newCity);
        }

        addressMapper.updateEntity(request, address);
        Address saved = addressRepository.save(address);

        if (request.contractIds() != null) {
            replaceAddressContracts(saved, request.contractIds());
        }

        log.info("Address updated successfully with id: {}", saved.getId());
        return addressMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        log.info("Deactivating address with id: {}", id);

        Address address = addressRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Address", "id", id));

        tenantSecurityService.validateCompanyAccess(address.getCompany().getId());

        address.setActive(false);
        addressRepository.save(address);

        log.info("Address deactivated successfully with id: {}", id);
    }

    @Override
    @Transactional
    public void activate(Long id) {
        log.info("Activating address with id: {}", id);

        Address address = addressRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Address", "id", id));

        tenantSecurityService.validateCompanyAccess(address.getCompany().getId());

        address.setActive(true);
        addressRepository.save(address);

        log.info("Address activated successfully with id: {}", id);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info("Hard deleting address with id: {}", id);

        Address address = addressRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Address", "id", id));

        tenantSecurityService.validateCompanyAccess(address.getCompany().getId());

        addressRepository.delete(address);

        log.info("Address hard deleted successfully with id: {}", id);
    }

    private void linkAddressToContracts(Address address, List<Long> contractIds) {
        var uniqueIds = new HashSet<>(contractIds);
        for (Long contractId : uniqueIds) {
            if (contractId == null) {
                continue;
            }
            Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract", "id", contractId));
            tenantSecurityService.validateCompanyAccess(contract.getCompany().getId());
            if (!Objects.equals(contract.getCompany().getId(), address.getCompany().getId())) {
                throw new BusinessException("Contract must belong to the same company as the address.");
            }
            if (!contract.getAllowedAddresses().contains(address)) {
                contract.getAllowedAddresses().add(address);
                contractRepository.save(contract);
            }
        }
    }

    private void replaceAddressContracts(Address address, List<Long> contractIds) {
        var desired = new HashSet<>(contractIds);

        // Remove from contracts no longer desired
        if (address.getId() != null) {
            for (Contract contract : contractRepository.findByAllowedAddressId(address.getId())) {
                boolean keep = desired.contains(contract.getId());
                if (!keep) {
                    tenantSecurityService.validateCompanyAccess(contract.getCompany().getId());
                    contract.getAllowedAddresses().removeIf(a -> Objects.equals(a.getId(), address.getId()));
                    contractRepository.save(contract);
                }
            }
        }

        // Add to desired contracts
        linkAddressToContracts(address, List.copyOf(desired));
    }
}
