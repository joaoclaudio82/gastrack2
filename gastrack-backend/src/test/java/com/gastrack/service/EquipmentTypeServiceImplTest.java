package com.gastrack.service;

import com.gastrack.dto.equipmenttype.EquipmentTypeRequest;
import com.gastrack.dto.equipmenttype.EquipmentTypeResponse;
import com.gastrack.exceptions.ConflictException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.EquipmentTypeMapper;
import com.gastrack.model.EquipmentType;
import com.gastrack.repository.EquipmentTypeRepository;
import com.gastrack.service.impl.EquipmentTypeServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EquipmentTypeServiceImplTest {

    @Mock
    private EquipmentTypeRepository equipmentTypeRepository;

    @Mock
    private EquipmentTypeMapper equipmentTypeMapper;

    @InjectMocks
    private EquipmentTypeServiceImpl equipmentTypeService;

    private EquipmentType testEntity;
    private EquipmentTypeRequest testRequest;
    private EquipmentTypeResponse testResponse;

    @BeforeEach
    void setUp() {
        testEntity = EquipmentType.builder()
            .id(1L)
            .name("Sensor de Pressão")
            .description("Sensor para monitoramento de pressão")
            .active(true)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        testRequest = new EquipmentTypeRequest(
            "Sensor de Pressão",
            "Sensor para monitoramento de pressão"
        );

        testResponse = new EquipmentTypeResponse(
            1L,
            "Sensor de Pressão",
            "Sensor para monitoramento de pressão",
            true,
            LocalDateTime.now(),
            LocalDateTime.now()
        );
    }

    @Test
    void should_CreateEquipmentType_When_ValidRequest() {
        when(equipmentTypeRepository.existsByName("Sensor de Pressão")).thenReturn(false);
        when(equipmentTypeMapper.toEntity(testRequest)).thenReturn(testEntity);
        when(equipmentTypeRepository.save(any(EquipmentType.class))).thenReturn(testEntity);
        when(equipmentTypeMapper.toResponse(testEntity)).thenReturn(testResponse);

        EquipmentTypeResponse result = equipmentTypeService.create(testRequest);

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Sensor de Pressão");
        assertThat(result.description()).isEqualTo("Sensor para monitoramento de pressão");
        verify(equipmentTypeRepository).save(any(EquipmentType.class));
    }

    @Test
    void should_ThrowException_When_NameExists() {
        when(equipmentTypeRepository.existsByName("Sensor de Pressão")).thenReturn(true);

        assertThatThrownBy(() -> equipmentTypeService.create(testRequest))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("name already exists");
    }

    @Test
    void should_FindById_When_Exists() {
        when(equipmentTypeRepository.findById(1L)).thenReturn(Optional.of(testEntity));
        when(equipmentTypeMapper.toResponse(testEntity)).thenReturn(testResponse);

        EquipmentTypeResponse result = equipmentTypeService.findById(1L);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("Sensor de Pressão");
    }

    @Test
    void should_ThrowException_When_IdNotFound() {
        when(equipmentTypeRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> equipmentTypeService.findById(999L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void should_FindAll_WithPagination() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<EquipmentType> entityPage = new PageImpl<>(List.of(testEntity));
        when(equipmentTypeRepository.findAll(pageable)).thenReturn(entityPage);
        when(equipmentTypeMapper.toResponse(testEntity)).thenReturn(testResponse);

        Page<EquipmentTypeResponse> result = equipmentTypeService.findAll(pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).name()).isEqualTo("Sensor de Pressão");
    }

    @Test
    void should_FindAllActive_WithPagination() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<EquipmentType> entityPage = new PageImpl<>(List.of(testEntity));
        when(equipmentTypeRepository.findByActive(true, pageable)).thenReturn(entityPage);
        when(equipmentTypeMapper.toResponse(testEntity)).thenReturn(testResponse);

        Page<EquipmentTypeResponse> result = equipmentTypeService.findAllActive(pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void should_UpdateEquipmentType_When_ValidRequest() {
        EquipmentTypeRequest updateRequest = new EquipmentTypeRequest(
            "Sensor de Pressão Atualizado",
            "Descrição atualizada"
        );

        EquipmentTypeResponse updatedResponse = new EquipmentTypeResponse(
            1L,
            "Sensor de Pressão Atualizado",
            "Descrição atualizada",
            true,
            LocalDateTime.now(),
            LocalDateTime.now()
        );

        when(equipmentTypeRepository.findById(1L)).thenReturn(Optional.of(testEntity));
        when(equipmentTypeRepository.save(any(EquipmentType.class))).thenReturn(testEntity);
        when(equipmentTypeMapper.toResponse(any(EquipmentType.class))).thenReturn(updatedResponse);

        EquipmentTypeResponse result = equipmentTypeService.update(1L, updateRequest);

        assertThat(result.name()).isEqualTo("Sensor de Pressão Atualizado");
        verify(equipmentTypeMapper).updateEntity(eq(updateRequest), any(EquipmentType.class));
    }

    @Test
    void should_ThrowException_When_UpdateNameToDuplicate() {
        EquipmentTypeRequest updateRequest = new EquipmentTypeRequest(
            "Existing Name",
            "Description"
        );

        EquipmentType existingEntity = EquipmentType.builder()
            .id(2L)
            .name("Existing Name")
            .build();

        when(equipmentTypeRepository.findById(1L)).thenReturn(Optional.of(testEntity));
        when(equipmentTypeRepository.findByName("Existing Name")).thenReturn(Optional.of(existingEntity));

        assertThatThrownBy(() -> equipmentTypeService.update(1L, updateRequest))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("name already exists");
    }

    @Test
    void should_AllowUpdate_When_SameName() {
        // Updating with the same name should be allowed
        EquipmentTypeRequest updateRequest = new EquipmentTypeRequest(
            "Sensor de Pressão",
            "Nova descrição"
        );

        when(equipmentTypeRepository.findById(1L)).thenReturn(Optional.of(testEntity));
        when(equipmentTypeRepository.save(any(EquipmentType.class))).thenReturn(testEntity);
        when(equipmentTypeMapper.toResponse(any(EquipmentType.class))).thenReturn(testResponse);

        EquipmentTypeResponse result = equipmentTypeService.update(1L, updateRequest);

        assertThat(result).isNotNull();
        verify(equipmentTypeRepository, never()).findByName(anyString());
    }

    @Test
    void should_DeactivateEquipmentType_When_Exists() {
        when(equipmentTypeRepository.findById(1L)).thenReturn(Optional.of(testEntity));

        equipmentTypeService.deactivate(1L);

        assertThat(testEntity.getActive()).isFalse();
        verify(equipmentTypeRepository).save(testEntity);
    }

    @Test
    void should_ActivateEquipmentType_When_Exists() {
        testEntity.setActive(false);
        when(equipmentTypeRepository.findById(1L)).thenReturn(Optional.of(testEntity));

        equipmentTypeService.activate(1L);

        assertThat(testEntity.getActive()).isTrue();
        verify(equipmentTypeRepository).save(testEntity);
    }

    @Test
    void should_SearchByNameContaining_When_SearchTermProvided() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<EquipmentType> entityPage = new PageImpl<>(List.of(testEntity));
        when(equipmentTypeRepository.findByNameContainingIgnoreCaseAndActive("Sensor", true, pageable))
            .thenReturn(entityPage);
        when(equipmentTypeMapper.toResponse(testEntity)).thenReturn(testResponse);

        Page<EquipmentTypeResponse> result = equipmentTypeService.searchActive("Sensor", pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).name()).contains("Sensor");
        verify(equipmentTypeRepository).findByNameContainingIgnoreCaseAndActive("Sensor", true, pageable);
    }

    @Test
    void should_ReturnAllActive_When_SearchTermIsNull() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<EquipmentType> entityPage = new PageImpl<>(List.of(testEntity));
        when(equipmentTypeRepository.findByActive(true, pageable)).thenReturn(entityPage);
        when(equipmentTypeMapper.toResponse(testEntity)).thenReturn(testResponse);

        Page<EquipmentTypeResponse> result = equipmentTypeService.searchActive(null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(equipmentTypeRepository).findByActive(true, pageable);
        verify(equipmentTypeRepository, never()).findByNameContainingIgnoreCaseAndActive(any(), any(), any());
    }

    @Test
    void should_ReturnAllActive_When_SearchTermIsBlank() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<EquipmentType> entityPage = new PageImpl<>(List.of(testEntity));
        when(equipmentTypeRepository.findByActive(true, pageable)).thenReturn(entityPage);
        when(equipmentTypeMapper.toResponse(testEntity)).thenReturn(testResponse);

        Page<EquipmentTypeResponse> result = equipmentTypeService.searchActive("   ", pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(equipmentTypeRepository).findByActive(true, pageable);
    }
}
