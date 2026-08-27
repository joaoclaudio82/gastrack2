package com.gastrack.service.impl;

import com.gastrack.dto.contract.ContractAddressResponse;
import com.gastrack.dto.contract.ContractAddressesUpdateRequest;
import com.gastrack.dto.contract.ContractRequest;
import com.gastrack.dto.contract.ContractResponse;
import com.gastrack.dto.contract.ContractStatusUpdateRequest;
import com.gastrack.exceptions.BusinessException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.ContractMapper;
import com.gastrack.model.Address;
import com.gastrack.model.Company;
import com.gastrack.model.Contract;
import com.gastrack.model.ContractStatus;
import com.gastrack.model.User;
import com.gastrack.repository.AddressRepository;
import com.gastrack.repository.CompanyRepository;
import com.gastrack.repository.ContractRepository;
import com.gastrack.security.TenantContext;
import com.gastrack.service.ContractService;
import com.gastrack.service.TenantSecurityService;
import com.gastrack.service.UserService;
import com.gastrack.utils.ContractNumberGenerator;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
@Slf4j
@Service
@RequiredArgsConstructor
public class ContractServiceImpl implements ContractService {

    private final ContractRepository contractRepository;
    private final CompanyRepository companyRepository;
    private final AddressRepository addressRepository;
    private final ContractMapper contractMapper;
    private final TenantSecurityService tenantSecurityService;
    private final UserService userService;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public ContractResponse create(ContractRequest request) {
        log.info("Creating contract for company: {}", request.companyId());

        // Validate company access
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(request.companyId());
        }

        Company company = companyRepository.findById(request.companyId())
            .orElseThrow(() -> new ResourceNotFoundException("Company", "id", request.companyId()));

        if (request.endDate() != null && request.endDate().isBefore(request.startDate())) {
            throw new BusinessException("End date must be after start date");
        }

        List<Address> allowedAddresses = loadAllowedAddresses(company.getId(), request.addressIds());

        Contract contract = contractMapper.toEntity(request);
        contract.setCompany(company);
        contract.setContractNumber(ContractNumberGenerator.generateTemporary());
        contract.setAllowedAddresses(allowedAddresses);

        // Set created by if user is logged in
        Long currentUserId = TenantContext.getCurrentUserId();
        if (currentUserId != null) {
            User currentUser = userService.findById(currentUserId);
            contract.setCreatedBy(currentUser);
        }

        Contract saved = contractRepository.save(contract);
        assignFinalContractNumber(saved);

        // Flush and clear to get fresh entity with linked addresses
        entityManager.flush();
        entityManager.clear();

        log.info("Contract created successfully with id: {}", saved.getId());
        return contractMapper.toResponse(contractRepository.findById(saved.getId()).orElseThrow());
    }

    @Override
    @Transactional(readOnly = true)
    public ContractResponse findById(Long id) {
        Contract contract = contractRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Contract", "id", id));

        // Validate access
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(contract.getCompany().getId());
        }

        return contractMapper.toResponse(contract);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ContractResponse> findAll(Pageable pageable, ContractStatus status, String search) {
        Long companyId = null;
        if (!TenantContext.isSuperAdmin()) {
            companyId = tenantSecurityService.requireCompanyContext();
        }

        String normalizedSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        Page<Contract> contracts = contractRepository.search(companyId, status, normalizedSearch, pageable);
        return contracts.map(contractMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ContractResponse> findByCompany(Long companyId, Pageable pageable) {
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(companyId);
        }

        return contractRepository.findByCompanyIdAndActive(companyId, true, pageable)
            .map(contractMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ContractResponse> findByCompanyAndStatus(Long companyId, ContractStatus status, Pageable pageable) {
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(companyId);
        }

        return contractRepository.findByCompanyIdAndStatus(companyId, status, pageable)
            .map(contractMapper::toResponse);
    }

    @Override
    @Transactional
    public ContractResponse update(Long id, ContractRequest request) {
        log.info("Updating contract with id: {}", id);

        Contract contract = contractRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Contract", "id", id));

        // Validate company access
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(contract.getCompany().getId());
        }

        // Validate company exists if changing
        Company company = companyRepository.findById(request.companyId())
            .orElseThrow(() -> new ResourceNotFoundException("Company", "id", request.companyId()));

        if (request.endDate() != null && request.endDate().isBefore(request.startDate())) {
            throw new BusinessException("End date must be after start date");
        }

        List<Address> allowedAddresses = loadAllowedAddresses(company.getId(), request.addressIds());

        // Validate kit quantity reduction
        if (request.kitQuantity() < contract.getKitQuantity()) {
            long activeKits = contractRepository.countActiveKitsByContractId(id);
            if (request.kitQuantity() < activeKits) {
                throw new BusinessException(
                    "Cannot reduce kit quantity below the number of active kits (" + activeKits + ")"
                );
            }
        }

        contractMapper.updateEntity(request, contract);
        contract.setCompany(company);
        contract.setAllowedAddresses(allowedAddresses);
        Contract saved = contractRepository.save(contract);

        log.info("Contract updated successfully with id: {}", saved.getId());
        return contractMapper.toResponse(contractRepository.findById(saved.getId()).orElseThrow());
    }

    @Override
    @Transactional
    public ContractResponse updateStatus(Long id, ContractStatusUpdateRequest request) {
        log.info("Updating status for contract with id: {} to {}", id, request.status());

        Contract contract = contractRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Contract", "id", id));

        // Validate company access
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(contract.getCompany().getId());
        }

        contract.setStatus(request.status());
        Contract saved = contractRepository.save(contract);

        log.info("Contract status updated successfully with id: {}", saved.getId());
        return contractMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ContractResponse updateAddresses(Long id, ContractAddressesUpdateRequest request) {
        log.info("Updating allowed addresses for contract with id: {}", id);

        Contract contract = contractRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Contract", "id", id));

        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(contract.getCompany().getId());
        }

        List<Address> allowedAddresses = loadAllowedAddresses(contract.getCompany().getId(), request.addressIds());
        contract.setAllowedAddresses(allowedAddresses);
        Contract saved = contractRepository.save(contract);

        log.info("Contract addresses updated successfully with id: {}", saved.getId());
        return contractMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractAddressResponse> getAllowedAddresses(Long id) {
        Contract contract = contractRepository.findByIdWithAddresses(id)
            .orElseThrow(() -> new ResourceNotFoundException("Contract", "id", id));

        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(contract.getCompany().getId());
        }

        return contract.getAllowedAddresses().stream()
            .sorted(Comparator.comparing(
                address -> Objects.requireNonNullElse(address.getName(), ""),
                String.CASE_INSENSITIVE_ORDER
            ))
            .map(address -> new ContractAddressResponse(
                address.getId(),
                address.getName(),
                address.getFullAddress(),
                address.getActive()
            ))
            .toList();
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        log.info("Deactivating contract with id: {}", id);

        Contract contract = contractRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Contract", "id", id));

        // Validate company access
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(contract.getCompany().getId());
        }

        contract.setActive(false);
        contractRepository.save(contract);

        log.info("Contract deactivated successfully with id: {}", id);
    }

    @Override
    @Transactional
    public void activate(Long id) {
        log.info("Activating contract with id: {}", id);

        Contract contract = contractRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Contract", "id", id));

        // Validate company access
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(contract.getCompany().getId());
        }

        contract.setActive(true);
        contractRepository.save(contract);

        log.info("Contract activated successfully with id: {}", id);
    }

    private List<Address> loadAllowedAddresses(Long companyId, List<Long> addressIds) {
        if (addressIds == null || addressIds.isEmpty()) {
            throw new BusinessException("At least one address must be selected");
        }

        List<Address> addresses = addressRepository.findAllById(addressIds);
        var addressesById = addresses.stream()
            .collect(java.util.stream.Collectors.toMap(Address::getId, address -> address));

        List<Address> ordered = new java.util.ArrayList<>();
        for (Long addressId : addressIds) {
            Address address = addressesById.get(addressId);
            if (address == null) {
                throw new ResourceNotFoundException("Address", "id", addressId);
            }
            if (!Objects.equals(address.getCompany().getId(), companyId)) {
                throw new BusinessException("Address must belong to the same company as the contract");
            }
            if (!Boolean.TRUE.equals(address.getActive())) {
                throw new BusinessException("Address " + address.getId() + " is inactive");
            }
            ordered.add(address);
        }
        return ordered;
    }

    private void assignFinalContractNumber(Contract contract) {
        if (contract.getId() == null) {
            return;
        }
        String finalNumber = ContractNumberGenerator.generate(contract.getStartDate(), contract.getId());
        if (!Objects.equals(finalNumber, contract.getContractNumber())) {
            contract.setContractNumber(finalNumber);
            contractRepository.save(contract);
        }
    }
}
