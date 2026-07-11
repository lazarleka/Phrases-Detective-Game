package com.phrasesdetective.backend.model;

import java.time.LocalDateTime;

public class AppUser {
  private Long id;
  private String username;
  private String email;
  private String passwordHash;
  private String role = "USER";
  private Integer gamesPlayed = 0;
  private Integer totalScore = 0;
  private Integer bestScore = 0;
  private Integer totalCorrect = 0;
  private Integer totalQuestions = 0;
  private LocalDateTime createdAt;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }

  public String getRole() {
    return role;
  }

  public void setRole(String role) {
    this.role = role;
  }

  public Integer getGamesPlayed() {
    return gamesPlayed;
  }

  public void setGamesPlayed(Integer gamesPlayed) {
    this.gamesPlayed = gamesPlayed;
  }

  public Integer getTotalScore() {
    return totalScore;
  }

  public void setTotalScore(Integer totalScore) {
    this.totalScore = totalScore;
  }

  public Integer getBestScore() {
    return bestScore;
  }

  public void setBestScore(Integer bestScore) {
    this.bestScore = bestScore;
  }

  public Integer getTotalCorrect() {
    return totalCorrect;
  }

  public void setTotalCorrect(Integer totalCorrect) {
    this.totalCorrect = totalCorrect;
  }

  public Integer getTotalQuestions() {
    return totalQuestions;
  }

  public void setTotalQuestions(Integer totalQuestions) {
    this.totalQuestions = totalQuestions;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }
}
