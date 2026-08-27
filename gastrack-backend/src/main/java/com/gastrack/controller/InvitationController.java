package com.gastrack.controller;

import com.gastrack.dto.invitation.CreateInvitationRequest;
import com.gastrack.dto.invitation.InvitationResponse;
import com.gastrack.model.InvitationStatus;
import com.gastrack.service.InvitationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for user invitation management.
 * Allows ADMIN and SUPER_ADMIN to invite new users to the system.
 */
@RestController
@RequestMapping("/api/v1/admin/invites")
@RequiredArgsConstructor
@Tag(name = "Invitations", description = "User invitation management endpoints (ADMIN and SUPER_ADMIN)")
public class InvitationController {

    private final InvitationService invitationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Create invitation", description = "Invite a new user to the system")
    public ResponseEntity<InvitationResponse> createInvitation(
            @Valid @RequestBody CreateInvitationRequest request) {
        InvitationResponse response = invitationService.createInvitation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List invitations", description = "List all invitations (filtered by company for ADMIN)")
    public ResponseEntity<Page<InvitationResponse>> listInvitations(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) InvitationStatus status) {
        return ResponseEntity.ok(invitationService.listInvitations(pageable, status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get invitation", description = "Get a specific invitation by ID")
    public ResponseEntity<InvitationResponse> getInvitation(@PathVariable Long id) {
        return ResponseEntity.ok(invitationService.getInvitation(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Cancel invitation", description = "Cancel a pending invitation and remove user from Cognito")
    public ResponseEntity<Void> cancelInvitation(@PathVariable Long id) {
        invitationService.cancelInvitation(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/resend")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Resend invitation", description = "Resend the invitation email with a new temporary password")
    public ResponseEntity<InvitationResponse> resendInvitation(@PathVariable Long id) {
        return ResponseEntity.ok(invitationService.resendInvitation(id));
    }
}
