package com.phrasesdetective.backend.dto;

public class ProfileStatsDto {
  private Integer level;
  private Integer xp;
  private Integer xpForCurrentLevel;
  private Integer xpForNextLevel;
  private Integer dailyStreak;
  private String weakestDifficulty;
  private Integer versusWins;
  private Integer versusLosses;
  private Integer versusDraws;

  public ProfileStatsDto(Integer level, Integer xp, Integer xpForCurrentLevel, Integer xpForNextLevel,
                         Integer dailyStreak, String weakestDifficulty, Integer versusWins,
                         Integer versusLosses, Integer versusDraws) {
    this.level = level;
    this.xp = xp;
    this.xpForCurrentLevel = xpForCurrentLevel;
    this.xpForNextLevel = xpForNextLevel;
    this.dailyStreak = dailyStreak;
    this.weakestDifficulty = weakestDifficulty;
    this.versusWins = versusWins;
    this.versusLosses = versusLosses;
    this.versusDraws = versusDraws;
  }

  public Integer getLevel() { return level; }
  public Integer getXp() { return xp; }
  public Integer getXpForCurrentLevel() { return xpForCurrentLevel; }
  public Integer getXpForNextLevel() { return xpForNextLevel; }
  public Integer getDailyStreak() { return dailyStreak; }
  public String getWeakestDifficulty() { return weakestDifficulty; }
  public Integer getVersusWins() { return versusWins; }
  public Integer getVersusLosses() { return versusLosses; }
  public Integer getVersusDraws() { return versusDraws; }
}
