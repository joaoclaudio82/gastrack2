package com.gastrack.mapper;

import com.gastrack.dto.device.DevicePingLogResponse;
import com.gastrack.model.DevicePingLog;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface DevicePingLogMapper {

    @Mapping(target = "equipmentId", source = "equipment.id")
    @Mapping(target = "equipmentAssetTag", source = "equipment.assetTag")
    @Mapping(target = "hasEquipment", expression = "java(entity.getEquipment() != null)")
    DevicePingLogResponse toResponse(DevicePingLog entity);
}
