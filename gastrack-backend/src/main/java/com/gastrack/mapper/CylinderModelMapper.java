package com.gastrack.mapper;

import com.gastrack.dto.cylindermodel.CylinderModelRequest;
import com.gastrack.dto.cylindermodel.CylinderModelResponse;
import com.gastrack.model.CylinderModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface CylinderModelMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "active", constant = "true")
    CylinderModel toEntity(CylinderModelRequest request);

    CylinderModelResponse toResponse(CylinderModel model);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(CylinderModelRequest request, @MappingTarget CylinderModel model);
}
