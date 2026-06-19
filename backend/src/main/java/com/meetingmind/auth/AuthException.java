package com.meetingmind.auth;

import org.springframework.http.HttpStatus;

/** Fachlicher Auth-Fehler mit passendem HTTP-Status und Nachricht fürs Frontend. */
public class AuthException extends RuntimeException {

    private final HttpStatus status;

    public AuthException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
