package com.gastrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {

    /** Só faz sentido para SUPER_ADMIN: quem opera uma empresa não conta empresas. */
    private long activeCompanies;
    private long activeGasPoints;
    private long activeContracts;
    private long activeKits;
    private long totalEquipments;
}
