package com.phrasesdetective.backend.controller;

import com.phrasesdetective.backend.dto.FriendDto;
import com.phrasesdetective.backend.dto.FriendsStateDto;
import com.phrasesdetective.backend.dto.MatchCreateRequest;
import com.phrasesdetective.backend.dto.MatchAnswerRequest;
import com.phrasesdetective.backend.dto.MatchDto;
import com.phrasesdetective.backend.dto.PhraseQuestionDto;
import com.phrasesdetective.backend.dto.MatchScoreRequest;
import com.phrasesdetective.backend.dto.QuestionsRequest;
import com.phrasesdetective.backend.dto.UsernameRequest;
import com.phrasesdetective.backend.service.AuthService;
import com.phrasesdetective.backend.service.SocialService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class SocialController {
  private final SocialService social;
  private final AuthService auth;

  public SocialController(SocialService social, AuthService auth) {
    this.social = social;
    this.auth = auth;
  }

  private String username(String authorization) { return auth.playerUsernameFromAuthorization(authorization); }

  @GetMapping("/users/search")
  public List<FriendDto> search(@RequestHeader("Authorization") String authorization, @RequestParam(defaultValue = "") String q) {
    return social.search(username(authorization), q);
  }

  @GetMapping("/friends")
  public FriendsStateDto friends(@RequestHeader("Authorization") String authorization) {
    return social.friends(username(authorization));
  }

  @PostMapping("/friends/requests")
  public FriendsStateDto sendRequest(@RequestHeader("Authorization") String authorization, @RequestBody UsernameRequest request) {
    return social.sendRequest(username(authorization), request.getUsername());
  }

  @PostMapping("/friends/requests/{id}/accept")
  public FriendsStateDto acceptRequest(@RequestHeader("Authorization") String authorization, @PathVariable long id) {
    return social.respondRequest(username(authorization), id, true);
  }

  @PostMapping("/friends/requests/{id}/reject")
  public FriendsStateDto rejectRequest(@RequestHeader("Authorization") String authorization, @PathVariable long id) {
    return social.respondRequest(username(authorization), id, false);
  }

  @GetMapping("/matches")
  public List<MatchDto> matches(@RequestHeader("Authorization") String authorization) {
    return social.matches(username(authorization));
  }

  @GetMapping("/questions")
  public List<PhraseQuestionDto> questions(@RequestHeader("Authorization") String authorization, @RequestParam(defaultValue = "EASY") String difficulty) {
    username(authorization);
    return social.questions(difficulty);
  }

  @PostMapping("/matches")
  public MatchDto createMatch(@RequestHeader("Authorization") String authorization, @RequestBody MatchCreateRequest request) {
    return social.createMatch(username(authorization), request);
  }

  @GetMapping("/matches/{id}")
  public MatchDto match(@RequestHeader("Authorization") String authorization, @PathVariable long id) {
    return social.match(username(authorization), id);
  }

  @PostMapping("/matches/{id}/accept")
  public MatchDto acceptMatch(@RequestHeader("Authorization") String authorization, @PathVariable long id) {
    return social.respondMatch(username(authorization), id, true);
  }

  @PostMapping("/matches/{id}/reject")
  public MatchDto rejectMatch(@RequestHeader("Authorization") String authorization, @PathVariable long id) {
    return social.respondMatch(username(authorization), id, false);
  }

  @PutMapping("/matches/{id}/questions")
  public MatchDto saveQuestions(@RequestHeader("Authorization") String authorization, @PathVariable long id, @RequestBody QuestionsRequest request) {
    return social.saveQuestions(username(authorization), id, request.getQuestionsJson());
  }

  @PostMapping("/matches/{id}/score")
  public MatchDto submitScore(@RequestHeader("Authorization") String authorization, @PathVariable long id, @RequestBody MatchScoreRequest request) {
    return social.submitScore(username(authorization), id, request);
  }

  @PostMapping("/matches/{id}/answers")
  public MatchDto submitAnswer(@RequestHeader("Authorization") String authorization, @PathVariable long id, @RequestBody MatchAnswerRequest request) {
    return social.submitAnswer(username(authorization), id, request);
  }

  @PostMapping("/matches/{id}/forfeit")
  public MatchDto forfeitMatch(@RequestHeader("Authorization") String authorization, @PathVariable long id) {
    return social.forfeitMatch(username(authorization), id);
  }
}
