package com.gastrack.controller;

import com.gastrack.dto.UpdateUserPreferencesRequest;
import com.gastrack.dto.UserPreferencesResponse;
import com.gastrack.service.UserPreferencesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for the authenticated user's application preferences.
 */
@RestController
@RequestMapping("/api/v1/users/me/preferences")
@RequiredArgsConstructor
@Tag(name = "User Preferences", description = "Per-user application preferences")
public class UserPreferencesController {

    private final UserPreferencesService service;

    @GetMapping
    @Operation(summary = "Get current user preferences",
               description = "Returns the authenticated user's preferences. Creates defaults if none exist.")
    public ResponseEntity<UserPreferencesResponse> getCurrent() {
        return ResponseEntity.ok(service.getCurrent());
    }

    @PutMapping
    @Operation(summary = "Update current user preferences (partial)",
               description = "Updates the authenticated user's preferences. Null fields keep current values.")
    public ResponseEntity<UserPreferencesResponse> updateCurrent(
            @Valid @RequestBody UpdateUserPreferencesRequest request) {
        return ResponseEntity.ok(service.updateCurrent(request));
    }
}
