package com.phrasesdetective.backend.repository;

import com.phrasesdetective.backend.dto.AchievementDto;
import com.phrasesdetective.backend.dto.DailyChallengeDto;
import com.phrasesdetective.backend.model.AppUser;
import com.phrasesdetective.backend.model.Difficulty;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Repository
public class GamificationRepository {
  private final Database database;

  public GamificationRepository(Database database) {
    this.database = database;
  }

  public List<AchievementDto> achievementsForUser(AppUser user) {
    List<AchievementDto> result = new ArrayList<>();
    String sql = "SELECT a.*, ua.unlocked_at FROM achievements a " +
        "LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = ? ORDER BY a.id";

    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setLong(1, user.getId());
      try (ResultSet rows = statement.executeQuery()) {
        while (rows.next()) {
          Timestamp unlockedAt = rows.getTimestamp("unlocked_at");
          result.add(new AchievementDto(
              rows.getLong("id"),
              rows.getString("code"),
              rows.getString("name"),
              rows.getString("description"),
              rows.getString("icon"),
              unlockedAt != null,
              unlockedAt == null ? null : unlockedAt.toLocalDateTime()
          ));
        }
      }
      return result;
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot read achievements", ex);
    }
  }

  public void unlockEligibleAchievements(AppUser user, boolean perfectGame, boolean dailyCompleted) {
    String sql = "INSERT IGNORE INTO user_achievements (user_id, achievement_id) " +
        "SELECT ?, id FROM achievements WHERE " +
        "(requirement_type = 'GAMES_PLAYED' AND ? >= requirement_value) OR " +
        "(requirement_type = 'TOTAL_CORRECT' AND ? >= requirement_value) OR " +
        "(requirement_type = 'TOTAL_SCORE' AND ? >= requirement_value) OR " +
        "(requirement_type = 'BEST_SCORE' AND ? >= requirement_value) OR " +
        "(requirement_type = 'PERFECT_GAME' AND ? = 1) OR " +
        "(requirement_type = 'DAILY_COMPLETED' AND ? = 1)";

    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setLong(1, user.getId());
      statement.setInt(2, user.getGamesPlayed());
      statement.setInt(3, user.getTotalCorrect());
      statement.setInt(4, user.getTotalScore());
      statement.setInt(5, user.getBestScore());
      statement.setInt(6, perfectGame ? 1 : 0);
      statement.setInt(7, dailyCompleted ? 1 : 0);
      statement.executeUpdate();
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot unlock achievements", ex);
    }
  }

  public DailyChallengeDto todayForUser(AppUser user) {
    LocalDate today = LocalDate.now();
    ensureDailyChallenge(today);
    String sql = "SELECT dc.*, udc.completed_at, udc.achieved_score FROM daily_challenges dc " +
        "LEFT JOIN user_daily_challenges udc ON udc.challenge_id = dc.id AND udc.user_id = ? " +
        "WHERE dc.challenge_date = ?";

    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setLong(1, user.getId());
      statement.setDate(2, Date.valueOf(today));
      try (ResultSet row = statement.executeQuery()) {
        if (!row.next()) {
          throw new IllegalStateException("Daily challenge was not created");
        }
        return mapChallenge(row);
      }
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot read daily challenge", ex);
    }
  }

  public boolean completeDailyIfEligible(AppUser user, Difficulty difficulty, int score) {
    DailyChallengeDto challenge = todayForUser(user);
    if (challenge.isCompleted() || !challenge.getDifficulty().equals(difficulty.name()) || score < challenge.getTargetScore()) {
      return false;
    }

    String sql = "INSERT IGNORE INTO user_daily_challenges (user_id, challenge_id, achieved_score) VALUES (?, ?, ?)";
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setLong(1, user.getId());
      statement.setLong(2, challenge.getId());
      statement.setInt(3, score);
      return statement.executeUpdate() > 0;
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot complete daily challenge", ex);
    }
  }

  private void ensureDailyChallenge(LocalDate date) {
    Difficulty[] difficulties = Difficulty.values();
    Difficulty difficulty = difficulties[(date.getDayOfYear() - 1) % difficulties.length];
    int target = difficulty == Difficulty.EASY ? 7 : difficulty == Difficulty.MEDIUM ? 6 : 5;
    int reward = difficulty == Difficulty.EASY ? 10 : difficulty == Difficulty.MEDIUM ? 15 : 20;
    String title = "Dnevni izazov: " + difficulty.name();
    String description = "Osvoji najmanje " + target + " poena na " + difficulty.name() + " težini.";

    String sql = "INSERT IGNORE INTO daily_challenges " +
        "(challenge_date, difficulty, target_score, reward_points, title, description) VALUES (?, ?, ?, ?, ?, ?)";
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setDate(1, Date.valueOf(date));
      statement.setString(2, difficulty.name());
      statement.setInt(3, target);
      statement.setInt(4, reward);
      statement.setString(5, title);
      statement.setString(6, description);
      statement.executeUpdate();
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot create daily challenge", ex);
    }
  }

  private DailyChallengeDto mapChallenge(ResultSet row) throws Exception {
    Timestamp completedAt = row.getTimestamp("completed_at");
    Integer achievedScore = completedAt == null ? null : row.getInt("achieved_score");
    return new DailyChallengeDto(
        row.getLong("id"),
        row.getDate("challenge_date").toLocalDate(),
        row.getString("title"),
        row.getString("description"),
        row.getString("difficulty"),
        row.getInt("target_score"),
        row.getInt("reward_points"),
        completedAt != null,
        achievedScore,
        completedAt == null ? null : completedAt.toLocalDateTime()
    );
  }
}
