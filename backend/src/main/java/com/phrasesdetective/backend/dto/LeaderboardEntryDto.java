package com.phrasesdetective.backend.dto;

import com.phrasesdetective.backend.model.AppUser;

public class LeaderboardEntryDto {
  private Integer rank;
  private String username;
  private Integer bestScore;
  private Integer totalScore;
  private Integer gamesPlayed;
  private Integer totalCorrect;
  private Integer totalQuestions;

  public static LeaderboardEntryDto from(AppUser user, int rank) {
    LeaderboardEntryDto dto = new LeaderboardEntryDto();
    dto.rank = rank;
    dto.username = user.getUsername();
    dto.bestScore = user.getBestScore();
    dto.totalScore = user.getTotalScore();
    dto.gamesPlayed = user.getGamesPlayed();
    dto.totalCorrect = user.getTotalCorrect();
    dto.totalQuestions = user.getTotalQuestions();
    return dto;
  }

  public Integer getRank() {
    return rank;
  }

  public String getUsername() {
    return username;
  }

  public Integer getBestScore() {
    return bestScore;
  }

  public Integer getTotalScore() {
    return totalScore;
  }

  public Integer getGamesPlayed() {
    return gamesPlayed;
  }

  public Integer getTotalCorrect() {
    return totalCorrect;
  }

  public Integer getTotalQuestions() {
    return totalQuestions;
  }
}
