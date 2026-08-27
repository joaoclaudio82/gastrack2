package com.gastrack.mapper;

import com.gastrack.dto.kitinstallation.KitInstallationResponse;
import com.gastrack.model.KitInstallation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface KitInstallationMapper {

    @Mapping(target = "kitId", source = "kit.id")
    @Mapping(target = "kitCode", source = "kit.kitCode")
    @Mapping(target = "addressId", source = "address.id")
    @Mapping(target = "addressName", source = "address.name")
    @Mapping(target = "performedById", source = "performedBy.id")
    @Mapping(target = "performedByName", expression = "java(installation.getPerformedBy() != null ? installation.getPerformedBy().getFullName() : null)")
    KitInstallationResponse toResponse(KitInstallation installation);
}
