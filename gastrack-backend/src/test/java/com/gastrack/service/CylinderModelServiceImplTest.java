package com.gastrack.service;

import com.gastrack.dto.cylindermodel.CylinderModelRequest;
import com.gastrack.dto.cylindermodel.CylinderModelResponse;
import com.gastrack.exceptions.ConflictException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.CylinderModelMapper;
import com.gastrack.model.CylinderModel;
import com.gastrack.model.GasType;
import com.gastrack.repository.CylinderModelRepository;
import com.gastrack.service.impl.CylinderModelServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CylinderModelServiceImplTest {

    @Mock
    private CylinderModelRepository repository;

    @Mock
    private CylinderModelMapper mapper;

    @InjectMocks
    private CylinderModelServiceImpl service;

    private CylinderModelRequest request;
    private CylinderModel entity;
    private CylinderModelResponse response;

    @BeforeEach
    void setUp() {
        request = new CylinderModelRequest("O2-50L-200BAR", GasType.O2,
            BigDecimal.valueOf(50), BigDecimal.valueOf(200));
        entity = CylinderModel.builder()
            .id(1L).codigo("O2-50L-200BAR").gasType(GasType.O2)
            .waterVolumeLiters(BigDecimal.valueOf(50)).capacityBar(BigDecimal.valueOf(200))
            .active(true).build();
        response = new CylinderModelResponse(1L, "O2-50L-200BAR", GasType.O2,
            BigDecimal.valueOf(50), BigDecimal.valueOf(200), true,
            LocalDateTime.now(), LocalDateTime.now());
    }

    @Test
    void should_CreateModel_When_CodigoUnique() {
        when(repository.existsByCodigo("O2-50L-200BAR")).thenReturn(false);
        when(mapper.toEntity(request)).thenReturn(entity);
        when(repository.save(entity)).thenReturn(entity);
        when(mapper.toResponse(entity)).thenReturn(response);

        CylinderModelResponse result = service.create(request);

        assertThat(result.codigo()).isEqualTo("O2-50L-200BAR");
        verify(repository).save(entity);
    }

    @Test
    void should_ThrowConflict_When_CodigoDuplicated() {
        when(repository.existsByCodigo("O2-50L-200BAR")).thenReturn(true);

        assertThatThrownBy(() -> service.create(request))
            .isInstanceOf(ConflictException.class);

        verify(repository, never()).save(any());
    }

    @Test
    void should_ThrowNotFound_When_UpdateMissingModel() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(99L, request))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void should_Deactivate_When_ModelExists() {
        when(repository.findById(1L)).thenReturn(Optional.of(entity));

        service.deactivate(1L);

        assertThat(entity.getActive()).isFalse();
        verify(repository).save(entity);
    }
}
