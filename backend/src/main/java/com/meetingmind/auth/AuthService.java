package com.meetingmind.auth;

import com.meetingmind.auth.dto.AuthResponse;
import com.meetingmind.auth.dto.LoginRequest;
import com.meetingmind.auth.dto.RegisterRequest;
import com.meetingmind.auth.dto.UserDto;
import com.meetingmind.user.User;
import com.meetingmind.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());

        if (email.isEmpty()) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Bitte gib eine E-Mail-Adresse an.");
        }
        if (request.password() == null || request.password().length() < 6) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Das Passwort muss mindestens 6 Zeichen lang sein.");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            throw new AuthException(HttpStatus.CONFLICT, "Diese E-Mail-Adresse ist bereits registriert.");
        }

        String[] names = splitName(request.name());

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFirstName(names[0]);
        user.setLastName(names[1]);
        user.setRole("USER");

        User saved = userRepository.save(user);

        return buildResponse(saved);
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new AuthException(HttpStatus.UNAUTHORIZED,
                "E-Mail-Adresse oder Passwort ist falsch."));

        if (request.password() == null
                || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "E-Mail-Adresse oder Passwort ist falsch.");
        }

        return buildResponse(user);
    }

    private AuthResponse buildResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, UserDto.from(user));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    /** Zerlegt einen einzelnen Namen in Vor- und Nachname (Frontend sendet nur "name"). */
    private String[] splitName(String name) {
        String trimmed = name == null ? "" : name.trim();
        if (trimmed.isEmpty()) {
            return new String[]{"MeetingMind", "User"};
        }
        int space = trimmed.indexOf(' ');
        if (space < 0) {
            return new String[]{trimmed, ""};
        }
        return new String[]{
            trimmed.substring(0, space).trim(),
            trimmed.substring(space + 1).trim()
        };
    }
}
