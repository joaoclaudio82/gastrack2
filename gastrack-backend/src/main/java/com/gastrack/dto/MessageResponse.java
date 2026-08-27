package com.gastrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Simple message response DTO.
 * Used for success/error messages without complex data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {

    private String message;
    private boolean success;

    /**
     * Create a success message response.
     *
     * @param message Success message
     * @return MessageResponse with success=true
     */
    public static MessageResponse success(String message) {
        return new MessageResponse(message, true);
    }

    /**
     * Create an error message response.
     *
     * @param message Error message
     * @return MessageResponse with success=false
     */
    public static MessageResponse error(String message) {
        return new MessageResponse(message, false);
    }
}
