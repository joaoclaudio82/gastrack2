package com.gastrack.mapper;

import com.gastrack.dto.invitation.InvitationResponse;
import com.gastrack.model.UserInvitation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct mapper for UserInvitation entity.
 */
@Mapper(componentModel = "spring")
public interface InvitationMapper {

    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "companyName", source = "company.name")
    @Mapping(target = "createdByEmail", source = "createdBy.email")
    InvitationResponse toResponse(UserInvitation invitation);
}
