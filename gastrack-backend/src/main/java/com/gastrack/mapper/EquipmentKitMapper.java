package com.gastrack.mapper;

import com.gastrack.dto.equipmentkit.EquipmentKitRequest;
import com.gastrack.dto.equipmentkit.EquipmentKitResponse;
import com.gastrack.model.EquipmentKit;
import org.mapstruct.*;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface EquipmentKitMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "contract", ignore = true)
    @Mapping(target = "address", ignore = true)
    @Mapping(target = "status", constant = "PENDING")
    @Mapping(target = "active", constant = "true")
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "equipments", ignore = true)
    EquipmentKit toEntity(EquipmentKitRequest request);

    @Mapping(target = "contractId", source = "contract.id")
    @Mapping(target = "contractNumber", source = "contract.contractNumber")
    @Mapping(target = "companyId", expression = "java(kit.getCompany() != null ? kit.getCompany().getId() : null)")
    @Mapping(target = "companyName", expression = "java(kit.getCompany() != null ? kit.getCompany().getName() : null)")
    @Mapping(target = "addressId", source = "address.id")
    @Mapping(target = "addressName", source = "address.name")
    @Mapping(target = "equipmentCount", expression = "java(countEquipments(kit))")
    @Mapping(target = "createdById", source = "createdBy.id")
    @Mapping(target = "createdByName", expression = "java(kit.getCreatedBy() != null ? kit.getCreatedBy().getFullName() : null)")
    @Mapping(target = "cylinders", ignore = true)
    EquipmentKitResponse toResponse(EquipmentKit kit);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "contract", ignore = true)
    @Mapping(target = "address", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "equipments", ignore = true)
    void updateEntity(EquipmentKitRequest request, @MappingTarget EquipmentKit kit);

    default int countEquipments(EquipmentKit kit) {
        if (kit.getEquipments() == null) {
            return 0;
        }
        return (int) kit.getEquipments().stream()
            .filter(eq -> Boolean.TRUE.equals(eq.getActive()))
            .count();
    }
}
