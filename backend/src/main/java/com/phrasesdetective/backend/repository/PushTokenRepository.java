package com.phrasesdetective.backend.repository;

import com.phrasesdetective.backend.model.AppUser;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

@Repository
public class PushTokenRepository {
  private final Database database;

  public PushTokenRepository(Database database) {
    this.database = database;
  }

  public void saveToken(AppUser user, String token, String platform) {
    String sql = "INSERT INTO push_tokens (user_id, token, platform) VALUES (?, ?, ?) " +
        "ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), platform = VALUES(platform), updated_at = CURRENT_TIMESTAMP";
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setLong(1, user.getId());
      statement.setString(2, token);
      statement.setString(3, platform == null || platform.isBlank() ? "android" : platform);
      statement.executeUpdate();
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot save push token", ex);
    }
  }

  public List<String> tokensForUser(long userId) {
    List<String> tokens = new ArrayList<>();
    try (Connection connection = database.connection();
         PreparedStatement statement = connection.prepareStatement("SELECT token FROM push_tokens WHERE user_id = ?")) {
      statement.setLong(1, userId);
      try (ResultSet rows = statement.executeQuery()) {
        while (rows.next()) tokens.add(rows.getString("token"));
      }
      return tokens;
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot read push tokens", ex);
    }
  }
}
