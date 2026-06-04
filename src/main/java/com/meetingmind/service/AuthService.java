package com.meetingmind.service;

import com.meetingmind.dto.AuthResponse;
import com.meetingmind.dto.ForgotPasswordRequest;
import com.meetingmind.dto.LoginRequest;
import com.meetingmind.dto.MessageResponse;
import com.meetingmind.dto.RegisterRequest;
import com.meetingmind.dto.ResetPasswordRequest;
import com.meetingmind.exception.AccountNotVerifiedException;
import com.meetingmind.exception.EmailAlreadyExistsException;
import com.meetingmind.exception.InvalidLoginException;
import com.meetingmind.exception.InvalidTokenException;
import com.meetingmind.exception.ValidationException;
import com.meetingmind.model.User;
import com.meetingmind.model.UserRole;
import com.meetingmind.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final MailService mailService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            MailService mailService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.mailService = mailService;
    }

    public MessageResponse register(RegisterRequest request) {
        validateRegisterRequest(request);

        String email = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException("Diese E-Mail ist bereits registriert.");
        }

        String verificationToken = UUID.randomUUID().toString();

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.USER);
        user.setEnabled(false);
        user.setVerificationToken(verificationToken);
        user.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(24));
        user.setCreatedAt(LocalDateTime.now());

        userRepository.save(user);

        mailService.sendVerificationEmail(user.getEmail(), verificationToken);

        return new MessageResponse("Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse.");
    }

    public MessageResponse verifyEmail(String token) {
        if (token == null || token.trim().isEmpty()) {
            throw new InvalidTokenException("Verifizierungslink ist ungültig.");
        }

        User user = userRepository.findByVerificationToken(token.trim())
                .orElseThrow(() -> new InvalidTokenException("Verifizierungslink ist ungültig oder wurde bereits verwendet."));

        if (user.getVerificationTokenExpiresAt() == null ||
                user.getVerificationTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Der Verifizierungslink ist abgelaufen.");
        }

        user.setEnabled(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiresAt(null);

        userRepository.save(user);

        return new MessageResponse("E-Mail erfolgreich bestätigt. Du kannst dich jetzt anmelden.");
    }

    public AuthResponse login(LoginRequest request) {
        validateLoginRequest(request);

        String email = normalizeEmail(request.getEmail());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidLoginException("E-Mail oder Passwort ist falsch."));

        boolean passwordMatches = passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash()
        );

        if (!passwordMatches) {
            throw new InvalidLoginException("E-Mail oder Passwort ist falsch.");
        }

        if (!user.isEnabled()) {
            throw new AccountNotVerifiedException("Bitte bestätige zuerst deine E-Mail-Adresse.");
        }

        String token = jwtService.generateToken(user);

        return toAuthResponse(user, token);
    }

    public AuthResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new InvalidLoginException("Benutzer nicht gefunden."));

        return toAuthResponse(user, null);
    }

    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new ValidationException("E-Mail darf nicht leer sein.");
        }

        String email = normalizeEmail(request.getEmail());

        userRepository.findByEmail(email).ifPresent(user -> {
            String resetToken = UUID.randomUUID().toString();

            user.setPasswordResetToken(resetToken);
            user.setPasswordResetTokenExpiresAt(LocalDateTime.now().plusMinutes(30));

            userRepository.save(user);

            mailService.sendPasswordResetEmail(user.getEmail(), resetToken);
        });

        return new MessageResponse("Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link versendet.");
    }

    public MessageResponse resetPassword(ResetPasswordRequest request) {
        validateResetPasswordRequest(request);

        User user = userRepository.findByPasswordResetToken(request.getToken().trim())
                .orElseThrow(() -> new InvalidTokenException("Reset-Link ist ungültig oder wurde bereits verwendet."));

        if (user.getPasswordResetTokenExpiresAt() == null ||
                user.getPasswordResetTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Der Reset-Link ist abgelaufen.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiresAt(null);

        userRepository.save(user);

        return new MessageResponse("Passwort wurde erfolgreich geändert.");
    }

    private AuthResponse toAuthResponse(User user, String token) {
        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.isEnabled()
        );
    }

    private void validateRegisterRequest(RegisterRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new ValidationException("Name darf nicht leer sein.");
        }

        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new ValidationException("E-Mail darf nicht leer sein.");
        }

        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new ValidationException("Passwort muss mindestens 6 Zeichen lang sein.");
        }
    }

    private void validateLoginRequest(LoginRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new ValidationException("E-Mail darf nicht leer sein.");
        }

        if (request.getPassword() == null || request.getPassword().isEmpty()) {
            throw new ValidationException("Passwort darf nicht leer sein.");
        }
    }

    private void validateResetPasswordRequest(ResetPasswordRequest request) {
        if (request.getToken() == null || request.getToken().trim().isEmpty()) {
            throw new ValidationException("Reset-Token darf nicht leer sein.");
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new ValidationException("Neues Passwort muss mindestens 6 Zeichen lang sein.");
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}