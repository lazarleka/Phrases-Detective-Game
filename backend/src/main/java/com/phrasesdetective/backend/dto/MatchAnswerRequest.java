package com.phrasesdetective.backend.dto;

public class MatchAnswerRequest {
  private Integer questionIndex;
  private Integer selectedAnswer;
  private Integer elapsedMs;

  public Integer getQuestionIndex() { return questionIndex; }
  public void setQuestionIndex(Integer questionIndex) { this.questionIndex = questionIndex; }
  public Integer getSelectedAnswer() { return selectedAnswer; }
  public void setSelectedAnswer(Integer selectedAnswer) { this.selectedAnswer = selectedAnswer; }
  public Integer getElapsedMs() { return elapsedMs; }
  public void setElapsedMs(Integer elapsedMs) { this.elapsedMs = elapsedMs; }
}
