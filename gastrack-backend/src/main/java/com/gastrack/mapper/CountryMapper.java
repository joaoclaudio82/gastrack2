package com.gastrack.mapper;

import com.gastrack.dto.country.CountryRequest;
import com.gastrack.dto.country.CountryResponse;
import com.gastrack.model.Country;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface CountryMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "active", constant = "true")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "states", ignore = true)
    Country toEntity(CountryRequest request);

    CountryResponse toResponse(Country country);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "states", ignore = true)
    void updateEntity(CountryRequest request, @MappingTarget Country country);
}
