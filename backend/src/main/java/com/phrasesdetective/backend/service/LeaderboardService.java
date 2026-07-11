package com.phrasesdetective.backend.service;

import com.phrasesdetective.backend.dto.LeaderboardEntryDto;
import com.phrasesdetective.backend.model.AppUser;
import com.phrasesdetective.backend.repository.AppUserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class LeaderboardService {
  private final AppUserRepository users;

  public LeaderboardService(AppUserRepository users) {
    this.users = users;
  }

  public List<LeaderboardEntryDto> topPlayers(int limit) {
    int safeLimit = Math.max(1, Math.min(limit, 100));
    List<AppUser> rankedUsers = users.topPlayers(safeLimit);
    List<LeaderboardEntryDto> result = new ArrayList<>();

    for (int i = 0; i < rankedUsers.size(); i++) {
      result.add(LeaderboardEntryDto.from(rankedUsers.get(i), i + 1));
    }

    return result;
  }
}
