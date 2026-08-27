package com.gastrack.mapper;

import com.gastrack.dto.cylinder.CylinderRequest;
import com.gastrack.dto.cylinder.CylinderResponse;
import com.gastrack.model.Cylinder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.math.BigDecimal;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface CylinderMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "cylinderModel", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "pontoGas", ignore = true)
    @Mapping(target = "address", ignore = true)
    @Mapping(target = "active", constant = "true")
    @Mapping(target = "connected", expression = "java(request.connected() == null || request.connected())")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Cylinder toEntity(CylinderRequest request);

    @Mapping(source = "cylinder.cylinderModel.id", target = "cylinderModelId")
    @Mapping(source = "cylinder.company.id", target = "companyId")
    @Mapping(source = "cylinder.company.name", target = "companyName")
    @Mapping(source = "cylinder.pontoGas.id", target = "pontoGasId")
    @Mapping(source = "cylinder.address.id", target = "addressId")
    @Mapping(source = "cylinder.cylinderModel.gasType", target = "gasType")
    @Mapping(source = "cylinder.cylinderModel.waterVolumeLiters", target = "waterVolumeLiters")
    @Mapping(source = "cylinder.cylinderModel.capacityBar", target = "capacityBar")
    @Mapping(source = "pricePerM3", target = "pricePerM3")
    CylinderResponse toResponse(Cylinder cylinder, BigDecimal pricePerM3);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "cylinderModel", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "pontoGas", ignore = true)
    @Mapping(target = "address", ignore = true)
    @Mapping(target = "active", ignore = true)
    /*
     * connected NÃO pode ser mapeado por expression aqui: NullValuePropertyMappingStrategy.IGNORE
     * só suprime propriedades nulas de mapeamento direto — uma expression é SEMPRE avaliada.
     * Como o formulário não envia o campo, ele chegaria nulo, viraria true, e reabriria em
     * silêncio a válvula de um casco de reserva (inflando o volume da linha).
     * Quem decide é o service, que só altera quando o request traz o campo explicitamente.
     */
    @Mapping(target = "connected", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(CylinderRequest request, @MappingTarget Cylinder cylinder);
}
