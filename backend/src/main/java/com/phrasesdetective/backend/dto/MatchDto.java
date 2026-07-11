package com.phrasesdetective.backend.dto;

import java.time.LocalDateTime;

public class MatchDto {
  private Long id;
  private FriendDto challenger;
  private FriendDto opponent;
  private String difficulty;
  private String status;
  private String questionsJson;
  private String challengerAnswersJson;
  private String opponentAnswersJson;
  private Integer challengerScore;
  private Integer opponentScore;
  private LocalDateTime createdAt;
  private LocalDateTime roundStartedAt;
  private Long roundStartedAtMs;
  private Long serverNowMs;

  public MatchDto(Long id, FriendDto challenger, FriendDto opponent, String difficulty, String status,
                  String questionsJson, String challengerAnswersJson, String opponentAnswersJson,
                  Integer challengerScore, Integer opponentScore, LocalDateTime createdAt, LocalDateTime roundStartedAt,
                  Long roundStartedAtMs, Long serverNowMs) {
    this.id = id;
    this.challenger = challenger;
    this.opponent = opponent;
    this.difficulty = difficulty;
    this.status = status;
    this.questionsJson = questionsJson;
    this.challengerAnswersJson = challengerAnswersJson;
    this.opponentAnswersJson = opponentAnswersJson;
    this.challengerScore = challengerScore;
    this.opponentScore = opponentScore;
    this.createdAt = createdAt;
    this.roundStartedAt = roundStartedAt;
    this.roundStartedAtMs = roundStartedAtMs;
    this.serverNowMs = serverNowMs;
  }

  public Long getId() { return id; }
  public FriendDto getChallenger() { return challenger; }
  public FriendDto getOpponent() { return opponent; }
  public String getDifficulty() { return difficulty; }
  public String getStatus() { return status; }
  public String getQuestionsJson() { return questionsJson; }
  public String getChallengerAnswersJson() { return challengerAnswersJson; }
  public String getOpponentAnswersJson() { return opponentAnswersJson; }
  public Integer getChallengerScore() { return challengerScore; }
  public Integer getOpponentScore() { return opponentScore; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public LocalDateTime getRoundStartedAt() { return roundStartedAt; }
  public Long getRoundStartedAtMs() { return roundStartedAtMs; }
  public Long getServerNowMs() { return serverNowMs; }
}
