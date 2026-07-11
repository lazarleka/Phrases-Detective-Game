package com.phrasesdetective.backend.controller;

import com.phrasesdetective.backend.dto.ProgressDto;
import com.phrasesdetective.backend.service.AuthService;
import com.phrasesdetective.backend.service.ProgressService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class UserController {
  private final ProgressService progressService;
  private final AuthService authService;

  public UserController(ProgressService progressService, AuthService authService) {
    this.progressService = progressService;
    this.authService = authService;
  }

  @GetMapping
  public ProgressDto me(@RequestHeader("Authorization") String authorization) {
    return progressService.getProgress(authService.usernameFromAuthorization(authorization));
  }
}
