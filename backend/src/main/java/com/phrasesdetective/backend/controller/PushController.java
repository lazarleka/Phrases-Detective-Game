package com.phrasesdetective.backend.controller;

import com.phrasesdetective.backend.dto.PushTokenRequest;
import com.phrasesdetective.backend.service.AuthService;
import com.phrasesdetective.backend.service.PushNotificationService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/push")
public class PushController {
  private final AuthService auth;
  private final PushNotificationService push;

  public PushController(AuthService auth, PushNotificationService push) {
    this.auth = auth;
    this.push = push;
  }

  @PostMapping("/tokens")
  public Map<String, Boolean> register(
      @RequestHeader("Authorization") String authorization,
      @RequestBody PushTokenRequest request
  ) {
    push.registerToken(auth.playerUsernameFromAuthorization(authorization), request.getToken(), request.getPlatform());
    return Map.of("ok", true);
  }

  @PostMapping("/test")
  public Map<String, Boolean> test(@RequestHeader("Authorization") String authorization) {
    push.testNotification(auth.playerUsernameFromAuthorization(authorization));
    return Map.of("ok", true);
  }
}
