package com.phrasesdetective.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class DailyChallengeDto {
  private Long id;
  private LocalDate date;
  private String title;
  private String description;
  private String difficulty;
  private Integer targetScore;
  private Integer rewardPoints;
  private boolean completed;
  private Integer achievedScore;
  private LocalDateTime completedAt;

  public DailyChallengeDto(Long id, LocalDate date, String title, String description, String difficulty,
                           Integer targetScore, Integer rewardPoints, boolean completed,
                           Integer achievedScore, LocalDateTime completedAt) {
    this.id = id;
    this.date = date;
    this.title = title;
    this.description = description;
    this.difficulty = difficulty;
    this.targetScore = targetScore;
    this.rewardPoints = rewardPoints;
    this.completed = completed;
    this.achievedScore = achievedScore;
    this.completedAt = completedAt;
  }

  public Long getId() { return id; }
  public LocalDate getDate() { return date; }
  public String getTitle() { return title; }
  public String getDescription() { return description; }
  public String getDifficulty() { return difficulty; }
  public Integer getTargetScore() { return targetScore; }
  public Integer getRewardPoints() { return rewardPoints; }
  public boolean isCompleted() { return completed; }
  public Integer getAchievedScore() { return achievedScore; }
  public LocalDateTime getCompletedAt() { return completedAt; }
}
