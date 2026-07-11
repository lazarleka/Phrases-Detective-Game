package com.phrasesdetective.backend.dto;

public class MatchScoreRequest {
  private Integer score;
  private Integer totalQuestions;
  private Integer durationSeconds;
  private Integer bonusPoints;
  private Integer maxStreak;
  private String answerHistoryJson;
  public Integer getScore() { return score; }
  public void setScore(Integer score) { this.score = score; }
  public Integer getTotalQuestions() { return totalQuestions; }
  public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
  public Integer getDurationSeconds() { return durationSeconds; }
  public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }
  public Integer getBonusPoints() { return bonusPoints; }
  public void setBonusPoints(Integer bonusPoints) { this.bonusPoints = bonusPoints; }
  public Integer getMaxStreak() { return maxStreak; }
  public void setMaxStreak(Integer maxStreak) { this.maxStreak = maxStreak; }
  public String getAnswerHistoryJson() { return answerHistoryJson; }
  public void setAnswerHistoryJson(String answerHistoryJson) { this.answerHistoryJson = answerHistoryJson; }
}
