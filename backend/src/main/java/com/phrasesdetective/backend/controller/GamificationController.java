package com.phrasesdetective.backend.controller;

import com.phrasesdetective.backend.dto.AchievementDto;
import com.phrasesdetective.backend.dto.DailyChallengeDto;
import com.phrasesdetective.backend.service.AuthService;
import com.phrasesdetective.backend.service.ProgressService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class GamificationController {
  private final ProgressService progressService;
  private final AuthService authService;

  public GamificationController(ProgressService progressService, AuthService authService) {
    this.progressService = progressService;
    this.authService = authService;
  }

  @GetMapping("/achievements")
  public List<AchievementDto> achievements(@RequestHeader("Authorization") String authorization) {
    return progressService.getAchievements(authService.playerUsernameFromAuthorization(authorization));
  }

  @GetMapping("/daily-challenge")
  public DailyChallengeDto dailyChallenge(@RequestHeader("Authorization") String authorization) {
    return progressService.getDailyChallenge(authService.playerUsernameFromAuthorization(authorization));
  }
}
