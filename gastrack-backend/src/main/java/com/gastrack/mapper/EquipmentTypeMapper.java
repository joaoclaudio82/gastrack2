package com.gastrack.mapper;

import com.gastrack.dto.equipmenttype.EquipmentTypeRequest;
import com.gastrack.dto.equipmenttype.EquipmentTypeResponse;
import com.gastrack.model.EquipmentType;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface EquipmentTypeMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "active", constant = "true")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    EquipmentType toEntity(EquipmentTypeRequest request);

    EquipmentTypeResponse toResponse(EquipmentType entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(EquipmentTypeRequest request, @MappingTarget EquipmentType entity);
}
