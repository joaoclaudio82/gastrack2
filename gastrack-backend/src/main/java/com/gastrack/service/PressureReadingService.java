package com.gastrack.service;

import com.gastrack.dto.pressure.PaginatedPressureResponse;
import com.gastrack.dto.pressure.PressureFilterParams;

public interface PressureReadingService {

    PaginatedPressureResponse getPressureReadings(PressureFilterParams filters);
}
