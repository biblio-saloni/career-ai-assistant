package com.tanisha.career_ai.config;

import com.tanisha.career_ai.exception.InvalidResumeFormatException;
import com.tanisha.career_ai.exception.LlmServiceException;
import com.tanisha.career_ai.exception.DatabaseException;
import com.tanisha.career_ai.model.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(InvalidResumeFormatException.class)
    public ResponseEntity<ErrorResponse> handleInvalidResume(InvalidResumeFormatException e) {
        logger.warn("Invalid resume format: {}", e.getMessage());
        return ResponseEntity.badRequest().body(
                new ErrorResponse("INVALID_FORMAT", e.getMessage())
        );
    }

    @ExceptionHandler(LlmServiceException.class)
    public ResponseEntity<ErrorResponse> handleLlmService(LlmServiceException e) {
        logger.error("LLM service error", e);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
                new ErrorResponse("SERVICE_UNAVAILABLE", "AI service temporarily unavailable. Please try again later.")
        );
    }

    @ExceptionHandler(DatabaseException.class)
    public ResponseEntity<ErrorResponse> handleDatabase(DatabaseException e) {
        logger.error("Database error", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ErrorResponse("DATABASE_ERROR", "Failed to save data. Please try again later.")
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException e) {
        logger.warn("Invalid argument: {}", e.getMessage());
        return ResponseEntity.badRequest().body(
                new ErrorResponse("INVALID_INPUT", e.getMessage())
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception e) {
        logger.error("Unexpected error", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred. Please try again later.")
        );
    }
}
