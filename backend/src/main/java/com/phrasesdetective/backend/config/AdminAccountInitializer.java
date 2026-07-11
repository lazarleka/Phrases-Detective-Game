package com.phrasesdetective.backend.config;

import com.phrasesdetective.backend.model.AppUser;
import com.phrasesdetective.backend.repository.AppUserRepository;
import com.phrasesdetective.backend.security.PasswordService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AdminAccountInitializer {
  private final AppUserRepository users;
  private final PasswordService passwords;
  private final String username;
  private final String email;
  private final String password;

  public AdminAccountInitializer(AppUserRepository users, PasswordService passwords,
      @Value("${app.admin.username:admin}") String username,
      @Value("${app.admin.email:admin@phrasesdetective.local}") String email,
      @Value("${app.admin.password:Admin123!}") String password) {
    this.users = users;
    this.passwords = passwords;
    this.username = username;
    this.email = email;
    this.password = password;
  }

  @PostConstruct
  public void createAdmin() {
    AppUser admin = users.findByUsername(username).orElse(null);
    if (admin == null) {
      admin = new AppUser();
      admin.setUsername(username);
      admin.setEmail(email);
      admin.setPasswordHash(passwords.hash(password));
    }
    admin.setRole("ADMIN");
    users.save(admin);
  }
}
