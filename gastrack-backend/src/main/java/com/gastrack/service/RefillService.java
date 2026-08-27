package com.gastrack.service;

import com.gastrack.dto.refill.RefillEventResponse;
import com.gastrack.dto.refill.RefillRequest;

import java.util.List;

public interface RefillService {

    /**
     * MANUAL refill: creates the new bottle on the point, deactivates the point's current
     * active cylinders, and records a MANUAL {@link com.gastrack.model.RefillEvent}.
     */
    RefillEventResponse registerRefill(Long gasPointId, RefillRequest request);

    List<RefillEventResponse> findByGasPoint(Long gasPointId);
}
