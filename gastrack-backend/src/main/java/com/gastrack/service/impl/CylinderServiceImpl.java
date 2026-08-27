package com.gastrack.service.impl;

import com.gastrack.dto.cylinder.CylinderRequest;
import com.gastrack.dto.cylinder.CylinderResponse;
import com.gastrack.exceptions.ConflictException;
import com.gastrack.exceptions.ErrorCodes;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.CylinderMapper;
import com.gastrack.model.Address;
import com.gastrack.model.Company;
import com.gastrack.model.Cylinder;
import com.gastrack.model.CylinderModel;
import com.gastrack.model.PontoGas;
import com.gastrack.repository.AddressRepository;
import com.gastrack.repository.CompanyRepository;
import com.gastrack.repository.CylinderModelRepository;
import com.gastrack.repository.CylinderRepository;
import com.gastrack.repository.PontoGasRepository;
import com.gastrack.service.CylinderService;
import com.gastrack.service.GasLinePolicy;
import com.gastrack.service.GasPriceService;
import com.gastrack.service.TenantSecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class CylinderServiceImpl implements CylinderService {

    private final CylinderRepository cylinderRepository;
    private final CylinderModelRepository cylinderModelRepository;
    private final PontoGasRepository pontoGasRepository;
    private final AddressRepository addressRepository;
    private final CompanyRepository companyRepository;
    private final CylinderMapper cylinderMapper;
    private final TenantSecurityService tenantSecurityService;
    private final GasPriceService gasPriceService;
    private final GasLinePolicy gasLinePolicy;

    @Override
    @Transactional
    public CylinderResponse create(CylinderRequest request) {
        log.info("Creating cylinder with serial number: {}", request.serialNumber());

        CylinderModel model = loadModel(request.cylinderModelId());
        PontoGas pontoGas = request.pontoGasId() != null ? loadPontoGas(request.pontoGasId()) : null;
        Address address = request.addressId() != null ? loadAddress(request.addressId()) : null;
        Company company = resolveCompany(request.companyId(), pontoGas, address);

        validateCompanyAccess(company);

        if (cylinderRepository.existsBySerialNumber(request.serialNumber())) {
            throw new ConflictException("Cylinder with this Serial number already exists",
                    ErrorCodes.CYLINDER_SERIAL_DUPLICATE);
        }

        gasLinePolicy.validateGasTypeMatchesLine(pontoGas, model, null);

        Cylinder cylinder = cylinderMapper.toEntity(request);
        cylinder.setCylinderModel(model);
        cylinder.setCompany(company);
        cylinder.setAddress(address);
        // Depois do address: setPontoGas espelha o endereço do ponto quando há ponto.
        cylinder.setPontoGas(pontoGas);
        Cylinder saved = cylinderRepository.save(cylinder);

        log.info("Cylinder created successfully with id: {}", saved.getId());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CylinderResponse findById(Long id) {
        Cylinder cylinder = cylinderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cylinder", "id", id));

        validateCompanyAccess(companyOf(cylinder));

        return toResponse(cylinder);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CylinderResponse> findAll(Pageable pageable, String search, Long addressId, Long pontoGasId) {
        Long companyId = null;
        if (!tenantSecurityService.isSuperAdmin()) {
            companyId = tenantSecurityService.requireCompanyContext();
        }

        Page<Cylinder> cylinders = cylinderRepository.search(companyId, addressId, pontoGasId, search, pageable);
        return cylinders.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CylinderResponse> findByAddressId(Long addressId, Pageable pageable) {
        Address address = loadAddress(addressId);

        tenantSecurityService.validateCompanyAccess(address.getCompany().getId());

        return cylinderRepository.findByAddressId(addressId, pageable)
            .map(this::toResponse);
    }

    @Override
    @Transactional
    public CylinderResponse update(Long id, CylinderRequest request) {
        log.info("Updating cylinder with id: {}", id);

        Cylinder cylinder = cylinderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cylinder", "id", id));

        validateCompanyAccess(companyOf(cylinder));

        CylinderModel model = loadModel(request.cylinderModelId());
        PontoGas pontoGas = request.pontoGasId() != null ? loadPontoGas(request.pontoGasId()) : null;
        Address address = request.addressId() != null ? loadAddress(request.addressId()) : null;
        Company company = resolveCompany(request.companyId(), pontoGas, address);

        validateCompanyAccess(company);

        if (!cylinder.getSerialNumber().equals(request.serialNumber())
            && cylinderRepository.existsBySerialNumber(request.serialNumber())) {
            throw new ConflictException("Cylinder with this Serial number already exists",
                    ErrorCodes.CYLINDER_SERIAL_DUPLICATE);
        }

        gasLinePolicy.validateGasTypeMatchesLine(pontoGas, model, cylinder.getId());

        cylinderMapper.updateEntity(request, cylinder);
        // Só mexe na válvula quando o request diz algo; ausência preserva o estado atual.
        if (request.connected() != null) {
            cylinder.setConnected(request.connected());
        }
        cylinder.setCylinderModel(model);
        cylinder.setCompany(company);
        cylinder.setAddress(address);
        // Depois do address: setPontoGas espelha o endereço do ponto quando há ponto.
        cylinder.setPontoGas(pontoGas);
        Cylinder saved = cylinderRepository.save(cylinder);

        log.info("Cylinder updated successfully with id: {}", saved.getId());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        Cylinder cylinder = cylinderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cylinder", "id", id));

        validateCompanyAccess(companyOf(cylinder));

        cylinder.setActive(false);
        cylinderRepository.save(cylinder);
    }

    @Override
    @Transactional
    public void activate(Long id) {
        Cylinder cylinder = cylinderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cylinder", "id", id));

        validateCompanyAccess(companyOf(cylinder));

        // Desativar preserva o vínculo com a linha, e a checagem de gás só olha os ativos: sem
        // esta guarda dava para desativar o N2 da linha, cadastrar um O2 nela e reativar o N2,
        // deixando dois gases no mesmo manifold. Quarto caminho que mexe na composição da linha
        // — a policy tem que valer nele também (CONVENTIONS §2).
        gasLinePolicy.validateGasTypeMatchesLine(
            cylinder.getPontoGas(), cylinder.getCylinderModel(), cylinder.getId());

        cylinder.setActive(true);
        cylinderRepository.save(cylinder);
    }

    private CylinderModel loadModel(Long modelId) {
        return cylinderModelRepository.findById(modelId)
            .orElseThrow(() -> new ResourceNotFoundException("CylinderModel", "id", modelId));
    }

    private PontoGas loadPontoGas(Long pontoGasId) {
        return pontoGasRepository.findById(pontoGasId)
            .orElseThrow(() -> new ResourceNotFoundException("PontoGas", "id", pontoGasId));
    }

    private Address loadAddress(Long addressId) {
        return addressRepository.findById(addressId)
            .orElseThrow(() -> new ResourceNotFoundException("Address", "id", addressId));
    }

    private Company loadCompany(Long companyId) {
        return companyRepository.findById(companyId)
            .orElseThrow(() -> new ResourceNotFoundException("Company", "id", companyId));
    }

    /**
     * Empresa dona do cilindro. Vem do {@code companyId} do request; se o cilindro também está
     * num ponto/endereço, a empresa deles precisa bater (integridade do multi-tenant).
     */
    private Company resolveCompany(Long companyId, PontoGas pontoGas, Address address) {
        Company company = companyId != null ? loadCompany(companyId) : companyOf(pontoGas, address);
        Company derived = companyOf(pontoGas, address);
        if (company != null && derived != null && !company.getId().equals(derived.getId())) {
            throw new ConflictException("Cylinder company must match the gas point/address company");
        }
        return company;
    }

    /** Desde a V45 {@code company} é NOT NULL — caminho único, sem fallback por ponto/endereço. */
    private Company companyOf(Cylinder cylinder) {
        return cylinder.getCompany();
    }

    private Company companyOf(PontoGas pontoGas, Address address) {
        if (pontoGas != null && pontoGas.getAddress() != null) {
            return pontoGas.getAddress().getCompany();
        }
        return address != null ? address.getCompany() : null;
    }

    private void validateCompanyAccess(Company company) {
        if (company != null) {
            tenantSecurityService.validateCompanyAccess(company.getId());
        }
    }

    private CylinderResponse toResponse(Cylinder cylinder) {
        return cylinderMapper.toResponse(cylinder, currentPrice(cylinder));
    }

    private BigDecimal currentPrice(Cylinder cylinder) {
        Company company = companyOf(cylinder);
        if (company == null || cylinder.getCylinderModel() == null) {
            return null;
        }
        try {
            return gasPriceService.findCurrent(company.getId(), cylinder.getCylinderModel().getGasType())
                .pricePerM3();
        } catch (ResourceNotFoundException e) {
            return null;
        }
    }
}
