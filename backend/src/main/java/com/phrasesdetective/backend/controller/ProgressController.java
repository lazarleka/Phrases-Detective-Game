package com.phrasesdetective.backend.controller;

import com.phrasesdetective.backend.dto.GameResultRequest;
import com.phrasesdetective.backend.dto.ProgressDto;
import com.phrasesdetective.backend.service.AuthService;
import com.phrasesdetective.backend.service.ProgressService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {
  private final ProgressService progressService;
  private final AuthService authService;

  public ProgressController(ProgressService progressService, AuthService authService) {
    this.progressService = progressService;
    this.authService = authService;
  }

  @GetMapping("/me")
  public ProgressDto myProgress(@RequestHeader("Authorization") String authorization) {
    return progressService.getProgress(authService.playerUsernameFromAuthorization(authorization));
  }

  @PostMapping("/games")
  public ProgressDto saveGame(
      @RequestHeader("Authorization") String authorization,
      @RequestBody GameResultRequest request
  ) {
    return progressService.saveGame(authService.playerUsernameFromAuthorization(authorization), request);
  }
}
