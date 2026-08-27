package com.gastrack.mapper;

import com.gastrack.dto.movementhistory.MovementHistoryResponse;
import com.gastrack.model.MovementHistory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface MovementHistoryMapper {

    @Mapping(target = "equipmentId", source = "equipment.id")
    @Mapping(target = "equipmentAssetTag", source = "equipment.assetTag")
    @Mapping(target = "equipmentKitId", source = "equipmentKit.id")
    @Mapping(target = "kitCode", source = "equipmentKit.kitCode")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userName", expression = "java(history.getUser() != null ? history.getUser().getFullName() : null)")
    @Mapping(target = "fromKitId", source = "fromKit.id")
    @Mapping(target = "fromKitCode", source = "fromKit.kitCode")
    @Mapping(target = "toKitId", source = "toKit.id")
    @Mapping(target = "toKitCode", source = "toKit.kitCode")
    MovementHistoryResponse toResponse(MovementHistory history);
}
