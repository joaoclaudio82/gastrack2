package com.gastrack.service.impl;

import com.gastrack.dto.equipmenttype.EquipmentTypeRequest;
import com.gastrack.dto.equipmenttype.EquipmentTypeResponse;
import com.gastrack.exceptions.ConflictException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.EquipmentTypeMapper;
import com.gastrack.model.EquipmentType;
import com.gastrack.repository.EquipmentTypeRepository;
import com.gastrack.service.EquipmentTypeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EquipmentTypeServiceImpl implements EquipmentTypeService {

    private final EquipmentTypeRepository equipmentTypeRepository;
    private final EquipmentTypeMapper equipmentTypeMapper;

    @Override
    @Transactional
    public EquipmentTypeResponse create(EquipmentTypeRequest request) {
        log.info("Creating equipment type: {}", request.name());

        if (equipmentTypeRepository.existsByName(request.name())) {
            throw new ConflictException("Equipment type with this name already exists");
        }

        EquipmentType entity = equipmentTypeMapper.toEntity(request);
        EquipmentType saved = equipmentTypeRepository.save(entity);

        log.info("Equipment type created successfully with id: {}", saved.getId());
        return equipmentTypeMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public EquipmentTypeResponse findById(Long id) {
        EquipmentType entity = equipmentTypeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentType", "id", id));
        return equipmentTypeMapper.toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EquipmentTypeResponse> findAll(Pageable pageable) {
        return equipmentTypeRepository.findAll(pageable)
            .map(equipmentTypeMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EquipmentTypeResponse> findAllActive(Pageable pageable) {
        return equipmentTypeRepository.findByActive(true, pageable)
            .map(equipmentTypeMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EquipmentTypeResponse> searchActive(String search, Pageable pageable) {
        if (search == null || search.isBlank()) {
            return findAllActive(pageable);
        }
        return equipmentTypeRepository.findByNameContainingIgnoreCaseAndActive(search.trim(), true, pageable)
            .map(equipmentTypeMapper::toResponse);
    }

    @Override
    @Transactional
    public EquipmentTypeResponse update(Long id, EquipmentTypeRequest request) {
        log.info("Updating equipment type with id: {}", id);

        EquipmentType entity = equipmentTypeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentType", "id", id));

        // Check if new name conflicts with another equipment type
        if (!entity.getName().equals(request.name())) {
            equipmentTypeRepository.findByName(request.name())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new ConflictException("Equipment type with this name already exists");
                    }
                });
        }

        equipmentTypeMapper.updateEntity(request, entity);
        EquipmentType saved = equipmentTypeRepository.save(entity);

        log.info("Equipment type updated successfully with id: {}", saved.getId());
        return equipmentTypeMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        log.info("Deactivating equipment type with id: {}", id);

        EquipmentType entity = equipmentTypeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentType", "id", id));

        entity.setActive(false);
        equipmentTypeRepository.save(entity);

        log.info("Equipment type deactivated successfully with id: {}", id);
    }

    @Override
    @Transactional
    public void activate(Long id) {
        log.info("Activating equipment type with id: {}", id);

        EquipmentType entity = equipmentTypeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentType", "id", id));

        entity.setActive(true);
        equipmentTypeRepository.save(entity);

        log.info("Equipment type activated successfully with id: {}", id);
    }
}
