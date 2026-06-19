package com.meetingmind.auth;

/**
 * Kleines internes Principal-Objekt für authentifizierte Requests.
 * Dadurch müssen Controller keine userId vom Frontend akzeptieren.
 */
public record AuthenticatedUser(Long id, String email, String role) {
}
