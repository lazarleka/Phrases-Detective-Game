package com.phrasesdetective.backend.dto;

public class FriendDto {
  private Long id;
  private String username;
  private Integer bestScore;
  private Integer totalScore;

  public FriendDto(Long id, String username, Integer bestScore, Integer totalScore) {
    this.id = id;
    this.username = username;
    this.bestScore = bestScore;
    this.totalScore = totalScore;
  }

  public Long getId() { return id; }
  public String getUsername() { return username; }
  public Integer getBestScore() { return bestScore; }
  public Integer getTotalScore() { return totalScore; }
}
