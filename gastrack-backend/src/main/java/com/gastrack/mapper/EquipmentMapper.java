package com.gastrack.mapper;

import com.gastrack.dto.equipment.EquipmentRequest;
import com.gastrack.dto.equipment.EquipmentResponse;
import com.gastrack.model.Equipment;
import org.mapstruct.*;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface EquipmentMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "equipmentKit", ignore = true)
    @Mapping(target = "equipmentType", ignore = true)
    @Mapping(target = "condition", defaultValue = "NEW")
    @Mapping(target = "active", constant = "true")
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Equipment toEntity(EquipmentRequest request);

    @Mapping(target = "equipmentKitId", source = "equipmentKit.id")
    @Mapping(target = "kitCode", source = "equipmentKit.kitCode")
    @Mapping(target = "equipmentTypeId", source = "equipmentType.id")
    @Mapping(target = "equipmentTypeName", source = "equipmentType.name")
    @Mapping(target = "companyId", expression = "java(equipment.getCompany() != null ? equipment.getCompany().getId() : null)")
    @Mapping(target = "companyName", expression = "java(equipment.getCompany() != null ? equipment.getCompany().getName() : null)")
    @Mapping(target = "createdById", source = "createdBy.id")
    @Mapping(target = "createdByName", expression = "java(equipment.getCreatedBy() != null ? equipment.getCreatedBy().getFullName() : null)")
    EquipmentResponse toResponse(Equipment equipment);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "equipmentKit", ignore = true)
    @Mapping(target = "equipmentType", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(EquipmentRequest request, @MappingTarget Equipment equipment);
}
