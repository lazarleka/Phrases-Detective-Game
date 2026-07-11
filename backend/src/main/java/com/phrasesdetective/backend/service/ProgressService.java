package com.phrasesdetective.backend.service;

import com.phrasesdetective.backend.dto.GameResultRequest;
import com.phrasesdetective.backend.dto.GameSessionDto;
import com.phrasesdetective.backend.dto.ProgressDto;
import com.phrasesdetective.backend.dto.UserDto;
import com.phrasesdetective.backend.dto.AchievementDto;
import com.phrasesdetective.backend.dto.DailyChallengeDto;
import com.phrasesdetective.backend.dto.ProfileStatsDto;
import com.phrasesdetective.backend.dto.VersusStatsDto;
import com.phrasesdetective.backend.model.AppUser;
import com.phrasesdetective.backend.model.Difficulty;
import com.phrasesdetective.backend.model.GameSession;
import com.phrasesdetective.backend.repository.AppUserRepository;
import com.phrasesdetective.backend.repository.GameSessionRepository;
import com.phrasesdetective.backend.repository.GamificationRepository;
import com.phrasesdetective.backend.repository.SocialRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ProgressService {
  private final AppUserRepository users;
  private final GameSessionRepository sessions;
  private final GamificationRepository gamification;
  private final SocialRepository social;

  public ProgressService(AppUserRepository users, GameSessionRepository sessions, GamificationRepository gamification, SocialRepository social) {
    this.users = users;
    this.sessions = sessions;
    this.gamification = gamification;
    this.social = social;
  }

  public ProgressDto saveGame(String username, GameResultRequest request) {
    validateGameResult(request);

    AppUser user = findUser(username);

    GameSession session = new GameSession();
    session.setUser(user);
    session.setDifficulty(request.getDifficulty());
    session.setMode(request.getMode());
    session.setScore(request.getScore());
    session.setTotalQuestions(request.getTotalQuestions());
    session.setDurationSeconds(request.getDurationSeconds());
    session.setBonusPoints(safeInt(request.getBonusPoints()));
    session.setMaxStreak(safeInt(request.getMaxStreak()));
    session.setAnswerHistoryJson(request.getAnswerHistoryJson());
    sessions.save(session);

    user.setGamesPlayed(user.getGamesPlayed() + 1);
    user.setTotalScore(user.getTotalScore() + request.getScore() + safeInt(request.getBonusPoints()));
    user.setBestScore(Math.max(user.getBestScore(), request.getScore()));
    user.setTotalCorrect(user.getTotalCorrect() + request.getScore());
    user.setTotalQuestions(user.getTotalQuestions() + request.getTotalQuestions());
    users.save(user);
    DailyChallengeDto dailyChallenge = gamification.todayForUser(user);
    boolean dailyCompleted = gamification.completeDailyIfEligible(user, request.getDifficulty(), request.getScore());
    if (dailyCompleted) {
      user.setTotalScore(user.getTotalScore() + dailyChallenge.getRewardPoints());
      users.save(user);
    }
    gamification.unlockEligibleAchievements(
        user,
        request.getScore().equals(request.getTotalQuestions()),
        dailyCompleted
    );

    return getProgress(username);
  }

  public ProgressDto getProgress(String username) {
    AppUser user = findUser(username);
    gamification.unlockEligibleAchievements(user, false, gamification.todayForUser(user).isCompleted());
    List<GameSession> recentSessions = sessions.recentForUser(user, 200);
    List<GameSessionDto> recentGames = recentSessions.stream()
        .limit(25)
        .map(GameSessionDto::from)
        .collect(Collectors.toList());

    return new ProgressDto(
        UserDto.from(user),
        recentGames,
        gamification.achievementsForUser(user),
        gamification.todayForUser(user),
        profileStats(user, recentSessions)
    );
  }

  public List<AchievementDto> getAchievements(String username) {
    AppUser user = findUser(username);
    gamification.unlockEligibleAchievements(user, false, gamification.todayForUser(user).isCompleted());
    return gamification.achievementsForUser(user);
  }

  public DailyChallengeDto getDailyChallenge(String username) {
    return gamification.todayForUser(findUser(username));
  }

  private void validateGameResult(GameResultRequest request) {
    if (request.getDifficulty() == null) {
      throw new IllegalArgumentException("Te\u017eina je obavezna.");
    }
    if (request.getMode() == null) {
      throw new IllegalArgumentException("Mod igre je obavezan.");
    }
    if (request.getScore() == null || request.getScore() < 0) {
      throw new IllegalArgumentException("Score nije ispravan.");
    }
    if (request.getTotalQuestions() == null || request.getTotalQuestions() < 1) {
      throw new IllegalArgumentException("Broj pitanja nije ispravan.");
    }
    if (request.getDurationSeconds() == null || request.getDurationSeconds() < 0) {
      throw new IllegalArgumentException("Trajanje igre nije ispravno.");
    }
    if (request.getBonusPoints() != null && request.getBonusPoints() < 0) {
      throw new IllegalArgumentException("Bonus poeni nisu ispravni.");
    }
    if (request.getMaxStreak() != null && request.getMaxStreak() < 0) {
      throw new IllegalArgumentException("Niz tačnih odgovora nije ispravan.");
    }
    if (request.getAnswerHistoryJson() != null && request.getAnswerHistoryJson().length() > 20000) {
      throw new IllegalArgumentException("Historija odgovora je prevelika.");
    }
    if (request.getScore() > request.getTotalQuestions()) {
      throw new IllegalArgumentException("Score ne moze biti veci od broja pitanja.");
    }
  }

  private ProfileStatsDto profileStats(AppUser user, List<GameSession> sessions) {
    int xp = user.getTotalScore();
    int level = Math.max(1, (xp / 100) + 1);
    int currentLevelXp = (level - 1) * 100;
    int nextLevelXp = level * 100;
    VersusStatsDto versus = social.versusStats(user);
    return new ProfileStatsDto(
        level,
        xp,
        currentLevelXp,
        nextLevelXp,
        dailyStreak(sessions),
        weakestDifficulty(sessions),
        versus.getWins(),
        versus.getLosses(),
        versus.getDraws()
    );
  }

  private int dailyStreak(List<GameSession> sessions) {
    Set<LocalDate> playedDates = new HashSet<>();
    for (GameSession session : sessions) {
      if (session.getPlayedAt() != null) playedDates.add(session.getPlayedAt().toLocalDate());
    }

    LocalDate cursor = LocalDate.now();
    if (!playedDates.contains(cursor)) cursor = cursor.minusDays(1);
    int streak = 0;
    while (playedDates.contains(cursor)) {
      streak++;
      cursor = cursor.minusDays(1);
    }
    return streak;
  }

  private String weakestDifficulty(List<GameSession> sessions) {
    Map<Difficulty, int[]> totals = new HashMap<>();
    for (GameSession session : sessions) {
      totals.computeIfAbsent(session.getDifficulty(), key -> new int[] {0, 0});
      totals.get(session.getDifficulty())[0] += session.getScore();
      totals.get(session.getDifficulty())[1] += session.getTotalQuestions();
    }
    return totals.entrySet().stream()
        .filter(entry -> entry.getValue()[1] > 0)
        .min(Comparator.comparingDouble(entry -> (double) entry.getValue()[0] / entry.getValue()[1]))
        .map(entry -> entry.getKey().name())
        .orElse("Nema podataka");
  }

  private int safeInt(Integer value) {
    return value == null ? 0 : value;
  }

  private AppUser findUser(String username) {
    return users.findByUsername(username)
        .orElseThrow(() -> new IllegalArgumentException("Korisnik nije pronadjen."));
  }
}
