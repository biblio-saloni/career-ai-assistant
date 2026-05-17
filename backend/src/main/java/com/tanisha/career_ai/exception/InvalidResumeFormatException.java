package com.tanisha.career_ai.exception;

public class InvalidResumeFormatException extends RuntimeException {
    public InvalidResumeFormatException(String message) {
        super(message);
    }

    public InvalidResumeFormatException(String message, Throwable cause) {
        super(message, cause);
    }
}
