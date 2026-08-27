package com.gastrack.mapper;

import com.gastrack.dto.gasprice.GasPriceResponse;
import com.gastrack.model.GasPrice;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface GasPriceMapper {

    @Mapping(source = "company.id", target = "companyId")
    @Mapping(source = "company.name", target = "companyName")
    GasPriceResponse toResponse(GasPrice gasPrice);
}
