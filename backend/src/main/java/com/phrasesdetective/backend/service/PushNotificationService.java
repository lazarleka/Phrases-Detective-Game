package com.phrasesdetective.backend.service;

import com.phrasesdetective.backend.model.AppUser;
import com.phrasesdetective.backend.repository.AppUserRepository;
import com.phrasesdetective.backend.repository.PushTokenRepository;
import org.springframework.stereotype.Service;

@Service
public class PushNotificationService {
  private final AppUserRepository users;
  private final PushTokenRepository pushTokens;

  public PushNotificationService(
      AppUserRepository users,
      PushTokenRepository pushTokens
  ) {
    this.users = users;
    this.pushTokens = pushTokens;
  }

  public void registerToken(String username, String token, String platform) {
    if (token == null || token.isBlank()) throw new IllegalArgumentException("Push token je obavezan.");
    AppUser user = users.findByUsername(username)
        .orElseThrow(() -> new IllegalArgumentException("Korisnik nije pronadjen."));
    pushTokens.saveToken(user, token.trim(), platform);
  }

  public void friendRequest(AppUser receiver, String senderUsername) {
    // Mobile notifications are handled without Firebase by client-side polling.
  }

  public void matchInvite(AppUser receiver, String challengerUsername, String difficulty) {
    // Mobile notifications are handled without Firebase by client-side polling.
  }

  public void testNotification(String username) {
    users.findByUsername(username)
        .orElseThrow(() -> new IllegalArgumentException("Korisnik nije pronadjen."));
  }
}
