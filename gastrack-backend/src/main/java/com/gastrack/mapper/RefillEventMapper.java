package com.gastrack.mapper;

import com.gastrack.dto.refill.RefillEventResponse;
import com.gastrack.model.RefillEvent;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RefillEventMapper {

    @Mapping(source = "gasPoint.id", target = "gasPointId")
    @Mapping(source = "cylinder.id", target = "cylinderId")
    @Mapping(source = "cylinder.serialNumber", target = "cylinderSerialNumber")
    RefillEventResponse toResponse(RefillEvent event);
}
