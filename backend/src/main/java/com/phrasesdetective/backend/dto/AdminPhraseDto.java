package com.phrasesdetective.backend.dto;

public class AdminPhraseDto {
  private final Long id;
  private final String phrase;
  private final String category;
  private final String difficulty;
  private final String correctAnswer;
  private final String wrongAnswer1;
  private final String wrongAnswer2;
  private final String wrongAnswer3;

  public AdminPhraseDto(Long id, String phrase, String category, String difficulty, String correctAnswer,
                        String wrongAnswer1, String wrongAnswer2, String wrongAnswer3) {
    this.id = id;
    this.phrase = phrase;
    this.category = category;
    this.difficulty = difficulty;
    this.correctAnswer = correctAnswer;
    this.wrongAnswer1 = wrongAnswer1;
    this.wrongAnswer2 = wrongAnswer2;
    this.wrongAnswer3 = wrongAnswer3;
  }

  public Long getId() { return id; }
  public String getPhrase() { return phrase; }
  public String getCategory() { return category; }
  public String getDifficulty() { return difficulty; }
  public String getCorrectAnswer() { return correctAnswer; }
  public String getWrongAnswer1() { return wrongAnswer1; }
  public String getWrongAnswer2() { return wrongAnswer2; }
  public String getWrongAnswer3() { return wrongAnswer3; }
}
