package com.gastrack.dto.pressure;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaginatedPressureResponse {
    private List<PressureReadingResponse> data;
    private PaginationMeta pagination;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PaginationMeta {
        private int count;
        private int limit;
        private boolean hasMore;
        private String nextCursor;
    }

    public static PaginatedPressureResponse of(
            List<PressureReadingResponse> data,
            int limit,
            boolean hasMore,
            String nextCursor
    ) {
        return PaginatedPressureResponse.builder()
                .data(data)
                .pagination(PaginationMeta.builder()
                        .count(data.size())
                        .limit(limit)
                        .hasMore(hasMore)
                        .nextCursor(hasMore ? nextCursor : null)
                        .build())
                .build();
    }
}
