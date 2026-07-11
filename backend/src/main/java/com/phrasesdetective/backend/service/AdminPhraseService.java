package com.phrasesdetective.backend.service;

import com.phrasesdetective.backend.dto.AdminPhraseDto;
import com.phrasesdetective.backend.dto.PhraseUpsertRequest;
import com.phrasesdetective.backend.model.Difficulty;
import com.phrasesdetective.backend.repository.PhraseRepository;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class AdminPhraseService {
  private final PhraseRepository phrases;

  public AdminPhraseService(PhraseRepository phrases) {
    this.phrases = phrases;
  }

  public List<AdminPhraseDto> search(String query) {
    return phrases.search(query);
  }

  public AdminPhraseDto create(PhraseUpsertRequest request) {
    normalizeAndValidate(request);
    return phrases.create(request);
  }

  public AdminPhraseDto update(long id, PhraseUpsertRequest request) {
    normalizeAndValidate(request);
    return phrases.update(id, request);
  }

  public void delete(long id) {
    phrases.delete(id);
  }

  private void normalizeAndValidate(PhraseUpsertRequest request) {
    if (request == null) throw new IllegalArgumentException("Podaci o frazi su obavezni.");
    request.setPhrase(require(request.getPhrase(), "Fraza", 160));
    request.setCategory("Opšte");
    request.setCorrectAnswer(require(request.getCorrectAnswer(), "Tačan odgovor", 255));
    request.setWrongAnswer1(require(request.getWrongAnswer1(), "Prvi netačan odgovor", 255));
    request.setWrongAnswer2(require(request.getWrongAnswer2(), "Drugi netačan odgovor", 255));
    request.setWrongAnswer3(require(request.getWrongAnswer3(), "Treći netačan odgovor", 255));
    try {
      request.setDifficulty(Difficulty.valueOf(require(request.getDifficulty(), "Težina", 20).toUpperCase()).name());
    } catch (IllegalArgumentException ex) {
      throw new IllegalArgumentException("Težina mora biti EASY, MEDIUM ili HARD.");
    }

    Set<String> answers = new HashSet<>();
    answers.add(request.getCorrectAnswer().toLowerCase());
    answers.add(request.getWrongAnswer1().toLowerCase());
    answers.add(request.getWrongAnswer2().toLowerCase());
    answers.add(request.getWrongAnswer3().toLowerCase());
    if (answers.size() != 4) throw new IllegalArgumentException("Sva četiri odgovora moraju biti različita.");
  }

  private String require(String value, String field, int maxLength) {
    if (value == null || value.trim().isEmpty()) throw new IllegalArgumentException(field + " je obavezna vrijednost.");
    String result = value.trim();
    if (result.length() > maxLength) throw new IllegalArgumentException(field + " je predugačka vrijednost.");
    return result;
  }
}
