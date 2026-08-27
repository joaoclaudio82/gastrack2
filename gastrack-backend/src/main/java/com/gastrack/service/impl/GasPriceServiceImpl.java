package com.gastrack.service.impl;

import com.gastrack.dto.gasprice.GasPriceRequest;
import com.gastrack.dto.gasprice.GasPriceResponse;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.GasPriceMapper;
import com.gastrack.model.Company;
import com.gastrack.model.GasPrice;
import com.gastrack.model.GasType;
import com.gastrack.repository.CompanyRepository;
import com.gastrack.repository.GasPriceRepository;
import com.gastrack.service.GasPriceService;
import com.gastrack.service.TenantSecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class GasPriceServiceImpl implements GasPriceService {

    private final GasPriceRepository repository;
    private final CompanyRepository companyRepository;
    private final GasPriceMapper mapper;
    private final TenantSecurityService tenantSecurityService;

    @Override
    @Transactional
    public GasPriceResponse create(GasPriceRequest request) {
        log.info("Creating gas price for company: {}, gasType: {}", request.companyId(), request.gasType());

        Company company = companyRepository.findById(request.companyId())
            .orElseThrow(() -> new ResourceNotFoundException("Company", "id", request.companyId()));

        tenantSecurityService.validateCompanyAccess(company.getId());

        // Append-only: always a brand new row, never an edit of an existing price.
        GasPrice gasPrice = GasPrice.builder()
            .company(company)
            .gasType(request.gasType())
            .pricePerM3(request.pricePerM3())
            .currency(request.currency() != null ? request.currency() : "BRL")
            .validFrom(request.validFrom() != null ? request.validFrom() : LocalDateTime.now())
            .active(true)
            .build();

        return mapper.toResponse(repository.save(gasPrice));
    }

    @Override
    @Transactional(readOnly = true)
    public List<GasPriceResponse> findByCompany(Long companyId) {
        tenantSecurityService.validateCompanyAccess(companyId);
        return repository.findByCompanyIdOrderByValidFromDesc(companyId).stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Override
    // noRollbackFor: "sem preço" (ResourceNotFound) é esperado e tratado pelos chamadores
    // (ex.: CylinderService.currentPrice → null). Sem isso, ao participar da transação de
    // criação do cilindro, a exceção marcava o tx como rollback-only → UnexpectedRollback (500).
    @Transactional(readOnly = true, noRollbackFor = ResourceNotFoundException.class)
    public GasPriceResponse findCurrent(Long companyId, GasType gasType) {
        tenantSecurityService.validateCompanyAccess(companyId);
        return repository.findCurrentByCompanyAndGasType(companyId, gasType, LocalDateTime.now(), PageRequest.of(0, 1))
            .stream()
            .findFirst()
            .map(mapper::toResponse)
            .orElseThrow(() -> new ResourceNotFoundException("GasPrice", "companyId/gasType", companyId + "/" + gasType));
    }
}
