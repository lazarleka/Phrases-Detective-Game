package com.phrasesdetective.backend.dto;

public class MatchCreateRequest {
  private String opponentUsername;
  private String difficulty;
  public String getOpponentUsername() { return opponentUsername; }
  public void setOpponentUsername(String opponentUsername) { this.opponentUsername = opponentUsername; }
  public String getDifficulty() { return difficulty; }
  public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
}
