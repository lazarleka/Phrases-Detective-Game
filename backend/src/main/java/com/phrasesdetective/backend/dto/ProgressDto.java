package com.phrasesdetective.backend.dto;

import java.util.List;

public class ProgressDto {
  private UserDto user;
  private List<GameSessionDto> recentGames;
  private List<AchievementDto> achievements;
  private DailyChallengeDto dailyChallenge;
  private ProfileStatsDto profileStats;

  public ProgressDto(UserDto user, List<GameSessionDto> recentGames, List<AchievementDto> achievements, DailyChallengeDto dailyChallenge, ProfileStatsDto profileStats) {
    this.user = user;
    this.recentGames = recentGames;
    this.achievements = achievements;
    this.dailyChallenge = dailyChallenge;
    this.profileStats = profileStats;
  }

  public UserDto getUser() {
    return user;
  }

  public List<GameSessionDto> getRecentGames() {
    return recentGames;
  }

  public List<AchievementDto> getAchievements() {
    return achievements;
  }

  public DailyChallengeDto getDailyChallenge() {
    return dailyChallenge;
  }

  public ProfileStatsDto getProfileStats() {
    return profileStats;
  }
}
