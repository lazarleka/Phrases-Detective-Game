package com.phrasesdetective.backend.dto;

public class PhraseUpsertRequest {
  private String phrase;
  private String category;
  private String difficulty;
  private String correctAnswer;
  private String wrongAnswer1;
  private String wrongAnswer2;
  private String wrongAnswer3;

  public String getPhrase() { return phrase; }
  public void setPhrase(String phrase) { this.phrase = phrase; }
  public String getCategory() { return category; }
  public void setCategory(String category) { this.category = category; }
  public String getDifficulty() { return difficulty; }
  public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
  public String getCorrectAnswer() { return correctAnswer; }
  public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }
  public String getWrongAnswer1() { return wrongAnswer1; }
  public void setWrongAnswer1(String wrongAnswer1) { this.wrongAnswer1 = wrongAnswer1; }
  public String getWrongAnswer2() { return wrongAnswer2; }
  public void setWrongAnswer2(String wrongAnswer2) { this.wrongAnswer2 = wrongAnswer2; }
  public String getWrongAnswer3() { return wrongAnswer3; }
  public void setWrongAnswer3(String wrongAnswer3) { this.wrongAnswer3 = wrongAnswer3; }
}
