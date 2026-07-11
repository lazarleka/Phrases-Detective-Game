package com.phrasesdetective.backend.dto;

import com.phrasesdetective.backend.model.GameSession;

import java.time.LocalDateTime;

public class GameSessionDto {
  private Long id;
  private String difficulty;
  private String mode;
  private Integer score;
  private Integer totalQuestions;
  private Integer durationSeconds;
  private Integer bonusPoints;
  private Integer maxStreak;
  private String answerHistoryJson;
  private LocalDateTime playedAt;

  public static GameSessionDto from(GameSession session) {
    GameSessionDto dto = new GameSessionDto();
    dto.id = session.getId();
    dto.difficulty = session.getDifficulty().name();
    dto.mode = session.getMode().name();
    dto.score = session.getScore();
    dto.totalQuestions = session.getTotalQuestions();
    dto.durationSeconds = session.getDurationSeconds();
    dto.bonusPoints = session.getBonusPoints();
    dto.maxStreak = session.getMaxStreak();
    dto.answerHistoryJson = session.getAnswerHistoryJson();
    dto.playedAt = session.getPlayedAt();
    return dto;
  }

  public Long getId() {
    return id;
  }

  public String getDifficulty() {
    return difficulty;
  }

  public String getMode() {
    return mode;
  }

  public Integer getScore() {
    return score;
  }

  public Integer getTotalQuestions() {
    return totalQuestions;
  }

  public Integer getDurationSeconds() {
    return durationSeconds;
  }

  public Integer getBonusPoints() {
    return bonusPoints;
  }

  public Integer getMaxStreak() {
    return maxStreak;
  }

  public String getAnswerHistoryJson() {
    return answerHistoryJson;
  }

  public LocalDateTime getPlayedAt() {
    return playedAt;
  }
}
