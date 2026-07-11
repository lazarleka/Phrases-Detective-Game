package com.phrasesdetective.backend.controller;

import com.phrasesdetective.backend.dto.AdminPhraseDto;
import com.phrasesdetective.backend.dto.PhraseUpsertRequest;
import com.phrasesdetective.backend.service.AdminPhraseService;
import com.phrasesdetective.backend.service.AuthService;
import org.springframework.web.bind.annotation.DeleteMapping;
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
import java.util.Map;

@RestController
@RequestMapping("/api/admin/phrases")
public class AdminPhraseController {
  private final AuthService auth;
  private final AdminPhraseService phrases;

  public AdminPhraseController(AuthService auth, AdminPhraseService phrases) {
    this.auth = auth;
    this.phrases = phrases;
  }

  @GetMapping
  public List<AdminPhraseDto> search(@RequestHeader("Authorization") String authorization,
                                     @RequestParam(defaultValue = "") String q) {
    auth.requireAdmin(authorization);
    return phrases.search(q);
  }

  @PostMapping
  public AdminPhraseDto create(@RequestHeader("Authorization") String authorization,
                               @RequestBody PhraseUpsertRequest request) {
    auth.requireAdmin(authorization);
    return phrases.create(request);
  }

  @PutMapping("/{id}")
  public AdminPhraseDto update(@RequestHeader("Authorization") String authorization, @PathVariable long id,
                               @RequestBody PhraseUpsertRequest request) {
    auth.requireAdmin(authorization);
    return phrases.update(id, request);
  }

  @DeleteMapping("/{id}")
  public Map<String, Boolean> delete(@RequestHeader("Authorization") String authorization, @PathVariable long id) {
    auth.requireAdmin(authorization);
    phrases.delete(id);
    return Map.of("deleted", true);
  }
}
