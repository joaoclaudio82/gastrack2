package com.gastrack.service.impl;

import com.gastrack.dto.company.CompanyRequest;
import com.gastrack.dto.company.CompanyResponse;
import com.gastrack.exceptions.BusinessException;
import com.gastrack.exceptions.ConflictException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.CompanyMapper;
import com.gastrack.model.*;
import com.gastrack.repository.*;
import com.gastrack.service.CompanyService;
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
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;
    private final AddressRepository addressRepository;
    private final CylinderRepository cylinderRepository;
    private final ContractRepository contractRepository;
    private final EquipmentKitRepository equipmentKitRepository;
    private final EquipmentRepository equipmentRepository;
    private final PontoGasRepository pontoGasRepository;
    private final CompanyMapper companyMapper;

    @Override
    @Transactional
    public CompanyResponse create(CompanyRequest request) {
        log.info("Creating company with slug: {}", request.slug());

        if (companyRepository.existsBySlug(request.slug())) {
            throw new ConflictException("Company with this slug already exists");
        }

        if (companyRepository.existsByCnpj(request.cnpj())) {
            throw new ConflictException("Company with this CNPJ already exists");
        }

        Company company = companyMapper.toEntity(request);
        Company saved = companyRepository.save(company);

        log.info("Company created successfully with id: {}", saved.getId());
        return companyMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyResponse findById(Long id) {
        Company company = companyRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Company", "id", id));
        return companyMapper.toResponse(company);
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyResponse findBySlug(String slug) {
        Company company = companyRepository.findBySlug(slug)
            .orElseThrow(() -> new ResourceNotFoundException("Company", "slug", slug));
        return companyMapper.toResponse(company);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CompanyResponse> findAll(Pageable pageable) {
        return companyRepository.findAll(pageable)
            .map(companyMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CompanyResponse> findAllActive(String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return companyRepository.findByActiveAndNameContainingIgnoreCase(true, search.trim(), pageable)
                .map(companyMapper::toResponse);
        }
        return companyRepository.findByActive(true, pageable)
            .map(companyMapper::toResponse);
    }

    @Override
    @Transactional
    public CompanyResponse update(Long id, CompanyRequest request) {
        log.info("Updating company with id: {}", id);

        Company company = companyRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Company", "id", id));

        // Check if new slug conflicts with another company
        if (!company.getSlug().equals(request.slug())) {
            companyRepository.findBySlug(request.slug())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new ConflictException("Company with this slug already exists");
                    }
                });
        }

        // Check if new CNPJ conflicts with another company
        if (!request.cnpj().equals(company.getCnpj())
            && companyRepository.existsByCnpj(request.cnpj())) {
            throw new ConflictException("Company with this CNPJ already exists");
        }

        companyMapper.updateEntity(request, company);
        Company saved = companyRepository.save(company);

        log.info("Company updated successfully with id: {}", saved.getId());
        return companyMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        log.info("Deactivating company with id: {}", id);

        Company company = companyRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Company", "id", id));

        if (!company.getActive()) {
            throw new BusinessException("Empresa já está desativada");
        }

        cascadeDeactivate(company);

        company.setActive(false);
        companyRepository.save(company);

        log.info("Company deactivated successfully with id: {}", id);
    }

    @Override
    @Transactional
    public void activate(Long id) {
        log.info("Activating company with id: {}", id);

        Company company = companyRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Company", "id", id));

        company.setActive(true);
        companyRepository.save(company);

        log.info("Company activated successfully with id: {} (related entities remain in their current state)", id);
    }

    /**
     * Cascades deactivation to all entities belonging to this company:
     * equipment → kits → contracts → gas points → cylinders → addresses
     */
    private void cascadeDeactivate(Company company) {
        Long companyId = company.getId();
        int equipmentCount = 0;
        int kitCount = 0;
        int contractCount = 0;
        int gasPointCount = 0;
        int cylinderCount = 0;
        int addressCount = 0;

        // 1. Deactivate equipment (via kits linked to company's contracts)
        List<EquipmentKit> kits = equipmentKitRepository.findActiveByCompanyIdList(companyId);
        for (EquipmentKit kit : kits) {
            List<Equipment> equipments = equipmentRepository.findByEquipmentKitIdAndActive(kit.getId(), true);
            for (Equipment equipment : equipments) {
                equipment.setActive(false);
                equipmentRepository.save(equipment);
                equipmentCount++;
            }
            // 2. Deactivate the kit
            kit.setActive(false);
            equipmentKitRepository.save(kit);
            kitCount++;
        }

        // 3. Deactivate contracts
        List<Contract> contracts = contractRepository.findByCompanyIdAndActiveTrue(companyId);
        for (Contract contract : contracts) {
            contract.setActive(false);
            contractRepository.save(contract);
            contractCount++;
        }

        // 4. Deactivate gas points, cylinders, and addresses
        List<Address> addresses = addressRepository.findByCompanyId(companyId);
        for (Address address : addresses) {
            // Gas points
            List<PontoGas> gasPoints = pontoGasRepository.findByAddressCompanyIdAndActiveTrue(companyId);
            for (PontoGas gp : gasPoints) {
                gp.setActive(false);
                pontoGasRepository.save(gp);
                gasPointCount++;
            }

            // Cylinders
            List<Cylinder> cylinders = cylinderRepository.findByAddressId(address.getId());
            for (Cylinder cylinder : cylinders) {
                if (cylinder.getActive()) {
                    cylinder.setActive(false);
                    cylinderRepository.save(cylinder);
                    cylinderCount++;
                }
            }

            // Address
            if (address.getActive()) {
                address.setActive(false);
                addressRepository.save(address);
                addressCount++;
            }
        }

        log.info("Cascade deactivation for company {}: {} equipment, {} kits, {} contracts, {} gas points, {} cylinders, {} addresses",
            companyId, equipmentCount, kitCount, contractCount, gasPointCount, cylinderCount, addressCount);
    }
}
