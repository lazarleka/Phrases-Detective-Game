package com.phrasesdetective.backend.model;

import java.time.LocalDateTime;

public class GameSession {
  private Long id;
  private AppUser user;
  private Difficulty difficulty;
  private GameMode mode;
  private Integer score;
  private Integer totalQuestions;
  private Integer durationSeconds;
  private Integer bonusPoints = 0;
  private Integer maxStreak = 0;
  private String answerHistoryJson;
  private LocalDateTime playedAt;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public AppUser getUser() {
    return user;
  }

  public void setUser(AppUser user) {
    this.user = user;
  }

  public Difficulty getDifficulty() {
    return difficulty;
  }

  public void setDifficulty(Difficulty difficulty) {
    this.difficulty = difficulty;
  }

  public GameMode getMode() {
    return mode;
  }

  public void setMode(GameMode mode) {
    this.mode = mode;
  }

  public Integer getScore() {
    return score;
  }

  public void setScore(Integer score) {
    this.score = score;
  }

  public Integer getTotalQuestions() {
    return totalQuestions;
  }

  public void setTotalQuestions(Integer totalQuestions) {
    this.totalQuestions = totalQuestions;
  }

  public Integer getDurationSeconds() {
    return durationSeconds;
  }

  public void setDurationSeconds(Integer durationSeconds) {
    this.durationSeconds = durationSeconds;
  }

  public Integer getBonusPoints() {
    return bonusPoints;
  }

  public void setBonusPoints(Integer bonusPoints) {
    this.bonusPoints = bonusPoints;
  }

  public Integer getMaxStreak() {
    return maxStreak;
  }

  public void setMaxStreak(Integer maxStreak) {
    this.maxStreak = maxStreak;
  }

  public String getAnswerHistoryJson() {
    return answerHistoryJson;
  }

  public void setAnswerHistoryJson(String answerHistoryJson) {
    this.answerHistoryJson = answerHistoryJson;
  }

  public LocalDateTime getPlayedAt() {
    return playedAt;
  }

  public void setPlayedAt(LocalDateTime playedAt) {
    this.playedAt = playedAt;
  }
}
