package com.gastrack.service;

import com.gastrack.dto.gasprice.GasPriceRequest;
import com.gastrack.dto.gasprice.GasPriceResponse;
import com.gastrack.model.GasType;

import java.util.List;

public interface GasPriceService {

    /** Always inserts a new row (append-only) — never edits an existing price. */
    GasPriceResponse create(GasPriceRequest request);

    List<GasPriceResponse> findByCompany(Long companyId);

    /** Current price = greatest validFrom <= now, active. */
    GasPriceResponse findCurrent(Long companyId, GasType gasType);
}
