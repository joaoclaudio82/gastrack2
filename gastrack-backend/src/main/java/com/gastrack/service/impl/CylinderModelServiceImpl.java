package com.gastrack.service.impl;

import com.gastrack.dto.cylindermodel.CylinderModelRequest;
import com.gastrack.dto.cylindermodel.CylinderModelResponse;
import com.gastrack.exceptions.ConflictException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.CylinderModelMapper;
import com.gastrack.model.CylinderModel;
import com.gastrack.repository.CylinderModelRepository;
import com.gastrack.service.CylinderModelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CylinderModelServiceImpl implements CylinderModelService {

    private final CylinderModelRepository repository;
    private final CylinderModelMapper mapper;

    @Override
    @Transactional
    public CylinderModelResponse create(CylinderModelRequest request) {
        log.info("Creating cylinder model with codigo: {}", request.codigo());

        if (repository.existsByCodigo(request.codigo())) {
            throw new ConflictException("Cylinder model with this codigo already exists");
        }

        CylinderModel saved = repository.save(mapper.toEntity(request));
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public CylinderModelResponse update(Long id, CylinderModelRequest request) {
        log.info("Updating cylinder model with id: {}", id);

        CylinderModel model = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("CylinderModel", "id", id));

        if (!model.getCodigo().equals(request.codigo()) && repository.existsByCodigo(request.codigo())) {
            throw new ConflictException("Cylinder model with this codigo already exists");
        }

        mapper.updateEntity(request, model);
        return mapper.toResponse(repository.save(model));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CylinderModelResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CylinderModelResponse findById(Long id) {
        CylinderModel model = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("CylinderModel", "id", id));
        return mapper.toResponse(model);
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        log.info("Deactivating cylinder model with id: {}", id);
        CylinderModel model = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("CylinderModel", "id", id));
        model.setActive(false);
        repository.save(model);
    }
}
