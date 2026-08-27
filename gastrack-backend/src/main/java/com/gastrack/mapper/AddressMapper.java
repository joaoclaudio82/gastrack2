package com.gastrack.mapper;

import com.gastrack.dto.address.AddressRequest;
import com.gastrack.dto.address.AddressResponse;
import com.gastrack.model.Address;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface AddressMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "city", ignore = true)
    @Mapping(target = "active", constant = "true")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "cylinders", ignore = true)
    @Mapping(target = "gasPoints", ignore = true)
    Address toEntity(AddressRequest request);

    @Mapping(source = "company.id", target = "companyId")
    @Mapping(source = "company.name", target = "companyName")
    @Mapping(source = "city.id", target = "cityId")
    @Mapping(source = "city.name", target = "cityName")
    @Mapping(source = "city.code", target = "cityCode")
    @Mapping(source = "city.state.id", target = "stateId")
    @Mapping(source = "city.state.name", target = "stateName")
    @Mapping(source = "city.state.abbreviation", target = "stateAbbreviation")
    @Mapping(source = "city.state.country.id", target = "countryId")
    @Mapping(source = "city.state.country.name", target = "countryName")
    @Mapping(target = "fullAddress", expression = "java(address.getFullAddress())")
    AddressResponse toResponse(Address address);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "city", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "cylinders", ignore = true)
    @Mapping(target = "gasPoints", ignore = true)
    void updateEntity(AddressRequest request, @MappingTarget Address address);
}
