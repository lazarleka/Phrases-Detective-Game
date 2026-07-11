package com.phrasesdetective.backend.dto;

import com.phrasesdetective.backend.model.AppUser;

public class UserDto {
  private Long id;
  private String username;
  private String email;
  private String role;
  private Integer gamesPlayed;
  private Integer totalScore;
  private Integer bestScore;
  private Integer totalCorrect;
  private Integer totalQuestions;

  public static UserDto from(AppUser user) {
    UserDto dto = new UserDto();
    dto.id = user.getId();
    dto.username = user.getUsername();
    dto.email = user.getEmail();
    dto.role = user.getRole();
    dto.gamesPlayed = user.getGamesPlayed();
    dto.totalScore = user.getTotalScore();
    dto.bestScore = user.getBestScore();
    dto.totalCorrect = user.getTotalCorrect();
    dto.totalQuestions = user.getTotalQuestions();
    return dto;
  }

  public Long getId() {
    return id;
  }

  public String getUsername() {
    return username;
  }

  public String getEmail() {
    return email;
  }

  public String getRole() {
    return role;
  }

  public Integer getGamesPlayed() {
    return gamesPlayed;
  }

  public Integer getTotalScore() {
    return totalScore;
  }

  public Integer getBestScore() {
    return bestScore;
  }

  public Integer getTotalCorrect() {
    return totalCorrect;
  }

  public Integer getTotalQuestions() {
    return totalQuestions;
  }
}
