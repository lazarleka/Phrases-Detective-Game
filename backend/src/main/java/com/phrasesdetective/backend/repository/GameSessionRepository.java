package com.phrasesdetective.backend.repository;

import com.phrasesdetective.backend.model.AppUser;
import com.phrasesdetective.backend.model.Difficulty;
import com.phrasesdetective.backend.model.GameMode;
import com.phrasesdetective.backend.model.GameSession;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

@Repository
public class GameSessionRepository {
  private final Database database;

  public GameSessionRepository(Database database) {
    this.database = database;
  }

  public GameSession save(GameSession session) {
    try (Connection connection = database.connection();
         PreparedStatement statement = connection.prepareStatement(
             "INSERT INTO game_sessions (user_id, difficulty, mode, score, total_questions, duration_seconds, bonus_points, max_streak, answer_history_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
             Statement.RETURN_GENERATED_KEYS
         )) {
      statement.setLong(1, session.getUser().getId());
      statement.setString(2, session.getDifficulty().name());
      statement.setString(3, session.getMode().name());
      statement.setInt(4, session.getScore());
      statement.setInt(5, session.getTotalQuestions());
      statement.setInt(6, session.getDurationSeconds());
      statement.setInt(7, session.getBonusPoints() == null ? 0 : session.getBonusPoints());
      statement.setInt(8, session.getMaxStreak() == null ? 0 : session.getMaxStreak());
      statement.setString(9, session.getAnswerHistoryJson());
      statement.executeUpdate();

      try (ResultSet keys = statement.getGeneratedKeys()) {
        if (keys.next()) {
          session.setId(keys.getLong(1));
        }
      }

      return session;
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot save game", ex);
    }
  }

  public List<GameSession> recentForUser(AppUser user, int limit) {
    List<GameSession> sessions = new ArrayList<>();

    try (Connection connection = database.connection();
         PreparedStatement statement = connection.prepareStatement(
             "SELECT * FROM game_sessions WHERE user_id = ? ORDER BY played_at DESC LIMIT ?"
         )) {
      statement.setLong(1, user.getId());
      statement.setInt(2, limit);

      try (ResultSet result = statement.executeQuery()) {
        while (result.next()) {
          sessions.add(map(result, user));
        }
      }
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot read games", ex);
    }

    return sessions;
  }

  private GameSession map(ResultSet result, AppUser user) throws Exception {
    GameSession session = new GameSession();
    session.setId(result.getLong("id"));
    session.setUser(user);
    session.setDifficulty(Difficulty.valueOf(result.getString("difficulty")));
    session.setMode(GameMode.valueOf(result.getString("mode")));
    session.setScore(result.getInt("score"));
    session.setTotalQuestions(result.getInt("total_questions"));
    session.setDurationSeconds(result.getInt("duration_seconds"));
    session.setBonusPoints(result.getInt("bonus_points"));
    session.setMaxStreak(result.getInt("max_streak"));
    session.setAnswerHistoryJson(result.getString("answer_history_json"));

    Timestamp playedAt = result.getTimestamp("played_at");
    if (playedAt != null) {
      session.setPlayedAt(playedAt.toLocalDateTime());
    }

    return session;
  }
}
