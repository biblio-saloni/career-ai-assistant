package com.tanisha.career_ai.model;

// import java.util.Map;

public class ErrorResponse {
    private String error;
    private String details;
    private long timestamp;

    public ErrorResponse(String error, String details) {
        this.error = error;
        this.details = details;
        this.timestamp = System.currentTimeMillis();
    }

    public String getError() {
        return error;
    }

    public String getDetails() {
        return details;
    }

    public long getTimestamp() {
        return timestamp;
    }
}
