package com.gastrack.mapper;

import com.gastrack.dto.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Mapper for converting Spring Data Page objects to PageResponse DTOs.
 */
@Component
public class PageMapper {

    /**
     * Convert Spring Data Page to PageResponse DTO.
     *
     * @param page    Spring Data Page object
     * @param content Mapped content list (already converted to DTOs)
     * @param <T>     Type of content in the response
     * @return PageResponse DTO with pagination metadata
     */
    public <T> PageResponse<T> toPageResponse(Page<?> page, List<T> content) {
        return PageResponse.<T>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}
