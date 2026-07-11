package com.phrasesdetective.backend.controller;

import com.phrasesdetective.backend.dto.LeaderboardEntryDto;
import com.phrasesdetective.backend.service.LeaderboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {
  private final LeaderboardService leaderboardService;

  public LeaderboardController(LeaderboardService leaderboardService) {
    this.leaderboardService = leaderboardService;
  }

  @GetMapping
  public List<LeaderboardEntryDto> topPlayers(@RequestParam(defaultValue = "50") int limit) {
    return leaderboardService.topPlayers(limit);
  }
}
