package com.gastrack.mapper;

import com.gastrack.dto.contract.ContractRequest;
import com.gastrack.dto.contract.ContractResponse;
import com.gastrack.model.Address;
import com.gastrack.model.Contract;
import org.mapstruct.*;

import java.util.Collections;
import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ContractMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "status", constant = "DRAFT")
    @Mapping(target = "active", constant = "true")
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "equipmentKits", ignore = true)
    @Mapping(target = "contractNumber", ignore = true)
    @Mapping(target = "allowedAddresses", ignore = true)
    Contract toEntity(ContractRequest request);

    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "companyName", source = "company.name")
    @Mapping(target = "activeKitsCount", expression = "java(countActiveKits(contract))")
    @Mapping(target = "remainingKitCapacity", expression = "java(contract.getRemainingKitCapacity())")
    @Mapping(target = "addressIds", expression = "java(toAddressIds(contract))")
    @Mapping(target = "createdById", source = "createdBy.id")
    @Mapping(target = "createdByName", expression = "java(contract.getCreatedBy() != null ? contract.getCreatedBy().getFullName() : null)")
    @Mapping(target = "allowedAddressIds", expression = "java(mapAllowedAddressIds(contract))")
    ContractResponse toResponse(Contract contract);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "equipmentKits", ignore = true)
    @Mapping(target = "contractNumber", ignore = true)
    @Mapping(target = "allowedAddresses", ignore = true)
    void updateEntity(ContractRequest request, @MappingTarget Contract contract);

    default int countActiveKits(Contract contract) {
        if (contract.getEquipmentKits() == null) {
            return 0;
        }
        return (int) contract.getEquipmentKits().stream()
            .filter(kit -> Boolean.TRUE.equals(kit.getActive()))
            .count();
    }

    default List<Long> toAddressIds(Contract contract) {
        // Legacy field in response: keep returning allowed address IDs.
        return mapAllowedAddressIds(contract);
    }

    default List<Long> mapAllowedAddressIds(Contract contract) {
        if (contract.getAllowedAddresses() == null || contract.getAllowedAddresses().isEmpty()) {
            return Collections.emptyList();
        }
        return contract.getAllowedAddresses().stream()
            .map(Address::getId)
            .filter(java.util.Objects::nonNull)
            .toList();
    }
}
