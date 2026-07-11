package com.phrasesdetective.backend.service;

import com.phrasesdetective.backend.dto.AuthResponse;
import com.phrasesdetective.backend.dto.LoginRequest;
import com.phrasesdetective.backend.dto.RegisterRequest;
import com.phrasesdetective.backend.dto.UserDto;
import com.phrasesdetective.backend.model.AppUser;
import com.phrasesdetective.backend.repository.AppUserRepository;
import com.phrasesdetective.backend.security.JwtService;
import com.phrasesdetective.backend.security.PasswordService;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
  private final AppUserRepository users;
  private final PasswordService passwordService;
  private final JwtService jwtService;

  public AuthService(AppUserRepository users, PasswordService passwordService, JwtService jwtService) {
    this.users = users;
    this.passwordService = passwordService;
    this.jwtService = jwtService;
  }

  public AuthResponse register(RegisterRequest request) {
    requireText(request.getUsername(), "Korisničko ime je obavezno.");
    requireText(request.getEmail(), "Email je obavezan.");
    requireText(request.getPassword(), "Lozinka je obavezna.");

    String username = request.getUsername().trim();
    String email = request.getEmail().trim().toLowerCase();

    if (username.length() < 3 || username.length() > 40) {
      throw new IllegalArgumentException("Korisničko ime mora imati 3-40 karaktera.");
    }
    if (!email.contains("@")) {
      throw new IllegalArgumentException("Email nije ispravan.");
    }
    if (request.getPassword().length() < 6) {
      throw new IllegalArgumentException("Lozinka mora imati najmanje 6 karaktera.");
    }
    if (users.existsByUsername(username)) {
      throw new IllegalArgumentException("Korisničko ime je već zauzeto.");
    }
    if (users.existsByEmail(email)) {
      throw new IllegalArgumentException("Email je već registrovan.");
    }

    AppUser user = new AppUser();
    user.setUsername(username);
    user.setEmail(email);
    user.setPasswordHash(passwordService.hash(request.getPassword()));
    AppUser savedUser = users.save(user);

    return new AuthResponse(jwtService.generateToken(savedUser.getUsername()), UserDto.from(savedUser));
  }

  public AuthResponse login(LoginRequest request) {
    requireText(request.getUsernameOrEmail(), "Korisničko ime ili email je obavezno.");
    requireText(request.getPassword(), "Lozinka je obavezna.");

    String usernameOrEmail = request.getUsernameOrEmail().trim();
    AppUser user = users.findByUsernameOrEmail(usernameOrEmail)
        .orElseThrow(() -> new IllegalArgumentException("Pogrešno korisničko ime/email ili lozinka."));

    if (!passwordService.matches(request.getPassword(), user.getPasswordHash())) {
      throw new IllegalArgumentException("Pogrešno korisničko ime/email ili lozinka.");
    }

    return new AuthResponse(jwtService.generateToken(user.getUsername()), UserDto.from(user));
  }

  public String usernameFromAuthorization(String authorization) {
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      throw new IllegalArgumentException("Nedostaje Authorization Bearer token.");
    }
    return jwtService.requireValidToken(authorization.substring(7));
  }

  public AppUser requireAdmin(String authorization) {
    AppUser user = users.findByUsername(usernameFromAuthorization(authorization))
        .orElseThrow(() -> new IllegalArgumentException("Korisnik nije pronađen."));
    if (!"ADMIN".equals(user.getRole())) {
      throw new IllegalArgumentException("Nemate dozvolu za pristup administraciji.");
    }
    return user;
  }

  public String playerUsernameFromAuthorization(String authorization) {
    AppUser user = users.findByUsername(usernameFromAuthorization(authorization))
        .orElseThrow(() -> new IllegalArgumentException("Korisnik nije pronađen."));
    if ("ADMIN".equals(user.getRole())) {
      throw new IllegalArgumentException("Admin nalog nema pristup funkcijama za igranje.");
    }
    return user.getUsername();
  }

  private void requireText(String value, String message) {
    if (value == null || value.trim().isEmpty()) {
      throw new IllegalArgumentException(message);
    }
  }
}
