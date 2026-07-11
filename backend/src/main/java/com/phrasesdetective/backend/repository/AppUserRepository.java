package com.phrasesdetective.backend.repository;

import com.phrasesdetective.backend.model.AppUser;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class AppUserRepository {
  private final Database database;

  public AppUserRepository(Database database) {
    this.database = database;
  }

  public Optional<AppUser> findByUsername(String username) {
    return findOne("SELECT * FROM users WHERE username = ?", username);
  }

  public Optional<AppUser> findByEmail(String email) {
    return findOne("SELECT * FROM users WHERE email = ?", email);
  }

  public Optional<AppUser> findByUsernameOrEmail(String value) {
    try (Connection connection = database.connection();
         PreparedStatement statement = connection.prepareStatement("SELECT * FROM users WHERE username = ? OR email = ?")) {
      statement.setString(1, value);
      statement.setString(2, value);

      try (ResultSet result = statement.executeQuery()) {
        return result.next() ? Optional.of(map(result)) : Optional.empty();
      }
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot read user", ex);
    }
  }

  public boolean existsByUsername(String username) {
    return findByUsername(username).isPresent();
  }

  public boolean existsByEmail(String email) {
    return findByEmail(email).isPresent();
  }

  public AppUser save(AppUser user) {
    if (user.getId() == null) {
      return insert(user);
    }
    update(user);
    return user;
  }

  public List<AppUser> topPlayers(int limit) {
    List<AppUser> users = new ArrayList<>();

    try (Connection connection = database.connection();
         PreparedStatement statement = connection.prepareStatement(
             "SELECT * FROM users ORDER BY total_score DESC, games_played ASC LIMIT ?"
         )) {
      statement.setInt(1, limit);

      try (ResultSet result = statement.executeQuery()) {
        while (result.next()) {
          users.add(map(result));
        }
      }
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot read leaderboard", ex);
    }

    return users;
  }

  private Optional<AppUser> findOne(String sql, String value) {
    try (Connection connection = database.connection();
         PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setString(1, value);

      try (ResultSet result = statement.executeQuery()) {
        return result.next() ? Optional.of(map(result)) : Optional.empty();
      }
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot read user", ex);
    }
  }

  private AppUser insert(AppUser user) {
    try (Connection connection = database.connection();
         PreparedStatement statement = connection.prepareStatement(
             "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
             Statement.RETURN_GENERATED_KEYS
         )) {
      statement.setString(1, user.getUsername());
      statement.setString(2, user.getEmail());
      statement.setString(3, user.getPasswordHash());
      statement.setString(4, user.getRole());
      statement.executeUpdate();

      try (ResultSet keys = statement.getGeneratedKeys()) {
        if (keys.next()) {
          user.setId(keys.getLong(1));
        }
      }

      return findByUsername(user.getUsername()).orElse(user);
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot create user", ex);
    }
  }

  private void update(AppUser user) {
    try (Connection connection = database.connection();
         PreparedStatement statement = connection.prepareStatement(
             "UPDATE users SET games_played = ?, total_score = ?, best_score = ?, total_correct = ?, total_questions = ?, role = ? WHERE id = ?"
         )) {
      statement.setInt(1, user.getGamesPlayed());
      statement.setInt(2, user.getTotalScore());
      statement.setInt(3, user.getBestScore());
      statement.setInt(4, user.getTotalCorrect());
      statement.setInt(5, user.getTotalQuestions());
      statement.setString(6, user.getRole());
      statement.setLong(7, user.getId());
      statement.executeUpdate();
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot update user", ex);
    }
  }

  static AppUser map(ResultSet result) throws Exception {
    AppUser user = new AppUser();
    user.setId(result.getLong("id"));
    user.setUsername(result.getString("username"));
    user.setEmail(result.getString("email"));
    user.setPasswordHash(result.getString("password_hash"));
    user.setRole(result.getString("role"));
    user.setGamesPlayed(result.getInt("games_played"));
    user.setTotalScore(result.getInt("total_score"));
    user.setBestScore(result.getInt("best_score"));
    user.setTotalCorrect(result.getInt("total_correct"));
    user.setTotalQuestions(result.getInt("total_questions"));

    Timestamp createdAt = result.getTimestamp("created_at");
    if (createdAt != null) {
      user.setCreatedAt(createdAt.toLocalDateTime());
    }

    return user;
  }
}
