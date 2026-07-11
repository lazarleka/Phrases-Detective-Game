package com.phrasesdetective.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.phrasesdetective.backend.dto.FriendDto;
import com.phrasesdetective.backend.dto.FriendsStateDto;
import com.phrasesdetective.backend.dto.GameResultRequest;
import com.phrasesdetective.backend.dto.MatchAnswerRequest;
import com.phrasesdetective.backend.dto.MatchCreateRequest;
import com.phrasesdetective.backend.dto.MatchDto;
import com.phrasesdetective.backend.dto.MatchScoreRequest;
import com.phrasesdetective.backend.dto.PhraseQuestionDto;
import com.phrasesdetective.backend.model.AppUser;
import com.phrasesdetective.backend.model.Difficulty;
import com.phrasesdetective.backend.model.GameMode;
import com.phrasesdetective.backend.repository.AppUserRepository;
import com.phrasesdetective.backend.repository.PhraseRepository;
import com.phrasesdetective.backend.repository.SocialRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SocialService {
  private static final int QUESTIONS_PER_GAME = 10;
  private final AppUserRepository users;
  private final SocialRepository social;
  private final PhraseRepository phrases;
  private final ProgressService progress;
  private final PushNotificationService pushNotifications;
  private final ObjectMapper objectMapper;

  public SocialService(AppUserRepository users, SocialRepository social, PhraseRepository phrases,
                       ProgressService progress, PushNotificationService pushNotifications,
                       ObjectMapper objectMapper) {
    this.users = users;
    this.social = social;
    this.phrases = phrases;
    this.progress = progress;
    this.pushNotifications = pushNotifications;
    this.objectMapper = objectMapper;
  }

  public List<FriendDto> search(String username, String query) {
    return social.searchUsers(user(username), query == null ? "" : query.trim());
  }

  public FriendsStateDto friends(String username) {
    return social.state(user(username));
  }

  public FriendsStateDto sendRequest(String username, String targetUsername) {
    AppUser sender = user(username);
    AppUser receiver = user(targetUsername);
    if (sender.getId().equals(receiver.getId())) throw new IllegalArgumentException("Ne mozete poslati zahtjev sebi.");
    if (social.areFriends(sender.getId(), receiver.getId())) throw new IllegalArgumentException("Vec ste prijatelji.");
    social.sendFriendRequest(sender, receiver);
    pushNotifications.friendRequest(receiver, sender.getUsername());
    return social.state(sender);
  }

  public FriendsStateDto respondRequest(String username, long requestId, boolean accept) {
    AppUser current = user(username);
    social.respondFriendRequest(requestId, current, accept);
    return social.state(current);
  }

  public MatchDto createMatch(String username, MatchCreateRequest request) {
    AppUser challenger = user(username);
    AppUser opponent = user(request.getOpponentUsername());
    if (social.hasPendingMatchBetween(challenger.getId(), opponent.getId())) {
      throw new IllegalArgumentException("Vec postoji Versus poziv na cekanju izmedju vas.");
    }
    if (!social.areFriends(challenger.getId(), opponent.getId())) throw new IllegalArgumentException("Mozete izazvati samo prijatelja.");
    String difficulty = Difficulty.valueOf(request.getDifficulty().toUpperCase()).name();
    MatchDto match = social.createMatch(challenger, opponent, difficulty);
    pushNotifications.matchInvite(opponent, challenger.getUsername(), difficulty);
    return match;
  }

  public List<MatchDto> matches(String username) {
    return social.matches(user(username));
  }

  public List<PhraseQuestionDto> questions(String difficulty) {
    return phrases.randomQuestions(Difficulty.valueOf(difficulty.toUpperCase()).name(), QUESTIONS_PER_GAME);
  }

  public MatchDto match(String username, long matchId) {
    AppUser current = user(username);
    MatchDto match = social.match(matchId, current.getId()).orElseThrow(() -> new IllegalArgumentException("Mec nije pronadjen."));
    if ("ACCEPTED".equals(match.getStatus()) && match.getQuestionsJson() == null) {
      return prepareMatchQuestions(match, current);
    }
    return match;
  }

  public MatchDto respondMatch(String username, long matchId, boolean accept) {
    AppUser current = user(username);
    social.respondMatch(matchId, current, accept);
    MatchDto match = match(username, matchId);
    return accept ? prepareMatchQuestions(match, current) : match;
  }

  public MatchDto saveQuestions(String username, long matchId, String questionsJson) {
    if (questionsJson == null || questionsJson.length() < 10) throw new IllegalArgumentException("Pitanja nisu ispravna.");
    return social.saveQuestions(matchId, user(username), questionsJson);
  }

  public MatchDto submitScore(String username, long matchId, MatchScoreRequest request) {
    AppUser current = user(username);
    MatchDto match = social.match(matchId, current.getId()).orElseThrow(() -> new IllegalArgumentException("Mec nije pronadjen."));
    if (!"ACCEPTED".equals(match.getStatus())) throw new IllegalArgumentException("Mec nije spreman za igru.");
    boolean challenger = match.getChallenger().getId().equals(current.getId());
    if ((challenger && match.getChallengerScore() != null) || (!challenger && match.getOpponentScore() != null)) {
      throw new IllegalArgumentException("Rezultat je vec poslat.");
    }

    GameResultRequest game = new GameResultRequest();
    game.setDifficulty(Difficulty.valueOf(match.getDifficulty()));
    game.setMode(GameMode.VERSUS);
    game.setScore(request.getScore());
    game.setTotalQuestions(request.getTotalQuestions());
    game.setDurationSeconds(request.getDurationSeconds());
    game.setBonusPoints(request.getBonusPoints());
    game.setMaxStreak(request.getMaxStreak());
    game.setAnswerHistoryJson(request.getAnswerHistoryJson());
    progress.saveGame(username, game);
    return social.saveScore(matchId, current, request.getScore());
  }

  public MatchDto submitAnswer(String username, long matchId, MatchAnswerRequest request) {
    AppUser current = user(username);
    MatchDto match = social.match(matchId, current.getId()).orElseThrow(() -> new IllegalArgumentException("Mec nije pronadjen."));
    if (!"ACCEPTED".equals(match.getStatus()) && !"COMPLETED".equals(match.getStatus())) throw new IllegalArgumentException("Mec nije spreman za igru.");
    if (match.getQuestionsJson() == null) match = prepareMatchQuestions(match, current);
    validateAnswer(request);

    boolean challenger = match.getChallenger().getId().equals(current.getId());
    List<AnswerEntry> myAnswers = parseAnswers(challenger ? match.getChallengerAnswersJson() : match.getOpponentAnswersJson());
    if (hasAnswer(myAnswers, request.getQuestionIndex())) return match;

    myAnswers.add(new AnswerEntry(request.getQuestionIndex(), request.getSelectedAnswer(), clampElapsed(request.getElapsedMs())));
    List<AnswerEntry> challengerAnswers = challenger ? myAnswers : parseAnswers(match.getChallengerAnswersJson());
    List<AnswerEntry> opponentAnswers = challenger ? parseAnswers(match.getOpponentAnswersJson()) : myAnswers;
    List<JsonNode> questions = parseQuestions(match.getQuestionsJson());
    int[] scores = calculateScores(questions, challengerAnswers, opponentAnswers);
    boolean completed = challengerAnswers.size() >= questions.size() && opponentAnswers.size() >= questions.size();
    boolean bothAnsweredCurrentQuestion = hasAnswer(challengerAnswers, request.getQuestionIndex()) && hasAnswer(opponentAnswers, request.getQuestionIndex());
    boolean startNextRoundTimer = bothAnsweredCurrentQuestion && !completed;

    MatchDto updated = social.saveAnswerState(matchId, current, toJson(myAnswers), scores[0], scores[1], completed, startNextRoundTimer);
    if (completed && !"COMPLETED".equals(match.getStatus())) {
      saveVersusProgress(match.getChallenger().getUsername(), match.getDifficulty(), scores[0], questions.size(), challengerAnswers);
      saveVersusProgress(match.getOpponent().getUsername(), match.getDifficulty(), scores[1], questions.size(), opponentAnswers);
    }
    return updated;
  }

  public MatchDto forfeitMatch(String username, long matchId) {
    AppUser current = user(username);
    MatchDto before = social.match(matchId, current.getId()).orElseThrow(() -> new IllegalArgumentException("Mec nije pronadjen."));
    if ("COMPLETED".equals(before.getStatus())) return before;
    if (!"ACCEPTED".equals(before.getStatus())) throw new IllegalArgumentException("Mec nije aktivan.");

    MatchDto updated = social.completeForfeit(matchId, current, QUESTIONS_PER_GAME);
    saveVersusProgress(updated.getChallenger().getUsername(), updated.getDifficulty(), updated.getChallengerScore(), QUESTIONS_PER_GAME, new ArrayList<>());
    saveVersusProgress(updated.getOpponent().getUsername(), updated.getDifficulty(), updated.getOpponentScore(), QUESTIONS_PER_GAME, new ArrayList<>());
    return updated;
  }

  private MatchDto prepareMatchQuestions(MatchDto match, AppUser user) {
    if (match.getQuestionsJson() != null) return match;
    try {
      String questionsJson = objectMapper.writeValueAsString(questions(match.getDifficulty()));
      return social.saveQuestions(match.getId(), user, questionsJson);
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot prepare match questions", ex);
    }
  }

  private void validateAnswer(MatchAnswerRequest request) {
    if (request.getQuestionIndex() == null || request.getQuestionIndex() < 0 || request.getQuestionIndex() >= QUESTIONS_PER_GAME) {
      throw new IllegalArgumentException("Pitanje nije ispravno.");
    }
    if (request.getSelectedAnswer() != null && (request.getSelectedAnswer() < 0 || request.getSelectedAnswer() > 3)) {
      throw new IllegalArgumentException("Odgovor nije ispravan.");
    }
  }

  private int clampElapsed(Integer elapsedMs) {
    if (elapsedMs == null) return 15000;
    return Math.max(0, Math.min(15000, elapsedMs));
  }

  private boolean hasAnswer(List<AnswerEntry> answers, int questionIndex) {
    return answers.stream().anyMatch(answer -> answer.questionIndex == questionIndex);
  }

  private List<AnswerEntry> parseAnswers(String json) {
    if (json == null || json.isBlank()) return new ArrayList<>();
    try {
      return objectMapper.readValue(json, new TypeReference<List<AnswerEntry>>() {});
    } catch (Exception ex) {
      return new ArrayList<>();
    }
  }

  private List<JsonNode> parseQuestions(String json) {
    try {
      return objectMapper.readValue(json, new TypeReference<List<JsonNode>>() {});
    } catch (Exception ex) {
      throw new IllegalArgumentException("Pitanja nisu ispravna.");
    }
  }

  private int[] calculateScores(List<JsonNode> questions, List<AnswerEntry> challengerAnswers, List<AnswerEntry> opponentAnswers) {
    Map<Integer, AnswerEntry> challenger = byQuestion(challengerAnswers);
    Map<Integer, AnswerEntry> opponent = byQuestion(opponentAnswers);
    int challengerScore = 0;
    int opponentScore = 0;
    for (int i = 0; i < questions.size(); i++) {
      AnswerEntry first = challenger.get(i);
      AnswerEntry second = opponent.get(i);
      if (first == null || second == null) continue;
      int correct = questions.get(i).path("correctAnswer").asInt(-1);
      boolean firstCorrect = first.selectedAnswer != null && first.selectedAnswer == correct;
      boolean secondCorrect = second.selectedAnswer != null && second.selectedAnswer == correct;
      if (firstCorrect && secondCorrect) {
        if (first.elapsedMs < second.elapsedMs) challengerScore++;
        else if (second.elapsedMs < first.elapsedMs) opponentScore++;
      } else if (firstCorrect) {
        challengerScore++;
      } else if (secondCorrect) {
        opponentScore++;
      }
    }
    return new int[] {challengerScore, opponentScore};
  }

  private Map<Integer, AnswerEntry> byQuestion(List<AnswerEntry> answers) {
    Map<Integer, AnswerEntry> result = new HashMap<>();
    for (AnswerEntry answer : answers) result.put(answer.questionIndex, answer);
    return result;
  }

  private String toJson(List<AnswerEntry> answers) {
    try {
      return objectMapper.writeValueAsString(answers);
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot write answer history", ex);
    }
  }

  private void saveVersusProgress(String username, String difficulty, int score, int totalQuestions, List<AnswerEntry> answers) {
    GameResultRequest game = new GameResultRequest();
    game.setDifficulty(Difficulty.valueOf(difficulty));
    game.setMode(GameMode.VERSUS);
    game.setScore(score);
    game.setTotalQuestions(totalQuestions);
    game.setDurationSeconds(Math.max(0, answers.stream().mapToInt(answer -> answer.elapsedMs).sum() / 1000));
    game.setBonusPoints(0);
    game.setMaxStreak(0);
    game.setAnswerHistoryJson(toJson(answers));
    progress.saveGame(username, game);
  }

  private AppUser user(String username) {
    return users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("Korisnik nije pronadjen."));
  }

  public static class AnswerEntry {
    public int questionIndex;
    public Integer selectedAnswer;
    public int elapsedMs;

    public AnswerEntry() {}

    public AnswerEntry(int questionIndex, Integer selectedAnswer, int elapsedMs) {
      this.questionIndex = questionIndex;
      this.selectedAnswer = selectedAnswer;
      this.elapsedMs = elapsedMs;
    }
  }
}
