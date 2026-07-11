package com.phrasesdetective.backend.dto;

import java.util.List;

public class PhraseQuestionDto {
  private String phrase;
  private String question;
  private List<String> options;
  private int correctAnswer;

  public PhraseQuestionDto(String phrase, String question, List<String> options, int correctAnswer) {
    this.phrase = phrase;
    this.question = question;
    this.options = options;
    this.correctAnswer = correctAnswer;
  }

  public String getPhrase() { return phrase; }
  public String getQuestion() { return question; }
  public List<String> getOptions() { return options; }
  public int getCorrectAnswer() { return correctAnswer; }
}
