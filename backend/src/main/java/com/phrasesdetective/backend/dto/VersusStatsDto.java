package com.phrasesdetective.backend.dto;

public class VersusStatsDto {
  private Integer wins;
  private Integer losses;
  private Integer draws;

  public VersusStatsDto(Integer wins, Integer losses, Integer draws) {
    this.wins = wins;
    this.losses = losses;
    this.draws = draws;
  }

  public Integer getWins() { return wins; }
  public Integer getLosses() { return losses; }
  public Integer getDraws() { return draws; }
}
