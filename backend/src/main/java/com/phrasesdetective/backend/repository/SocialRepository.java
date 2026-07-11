package com.phrasesdetective.backend.repository;

import com.phrasesdetective.backend.dto.FriendDto;
import com.phrasesdetective.backend.dto.FriendRequestDto;
import com.phrasesdetective.backend.dto.FriendsStateDto;
import com.phrasesdetective.backend.dto.MatchDto;
import com.phrasesdetective.backend.dto.VersusStatsDto;
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
public class SocialRepository {
  private static final int MATCH_INVITE_TIMEOUT_SECONDS = 15;
  private final Database database;

  public SocialRepository(Database database) {
    this.database = database;
  }

  public List<FriendDto> searchUsers(AppUser current, String query) {
    List<FriendDto> result = new ArrayList<>();
    String sql = "SELECT id, username, best_score, total_score FROM users WHERE id <> ? AND username LIKE ? ORDER BY username";
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setLong(1, current.getId());
      statement.setString(2, "%" + query + "%");
      try (ResultSet rows = statement.executeQuery()) {
        while (rows.next()) result.add(friend(rows, ""));
      }
      return result;
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot search users", ex);
    }
  }

  public FriendsStateDto state(AppUser user) {
    return new FriendsStateDto(friends(user), requests(user, true), requests(user, false));
  }

  public boolean areFriends(long first, long second) {
    long one = Math.min(first, second);
    long two = Math.max(first, second);
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(
        "SELECT 1 FROM friendships WHERE user_one_id = ? AND user_two_id = ?")) {
      statement.setLong(1, one);
      statement.setLong(2, two);
      try (ResultSet row = statement.executeQuery()) { return row.next(); }
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot check friendship", ex);
    }
  }

  public void sendFriendRequest(AppUser sender, AppUser receiver) {
    String sql = "INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, 'PENDING') " +
        "ON DUPLICATE KEY UPDATE status = 'PENDING', created_at = CURRENT_TIMESTAMP, responded_at = NULL";
    execute(sql, sender.getId(), receiver.getId());
  }

  public boolean hasPendingMatchBetween(long firstUserId, long secondUserId) {
    expirePendingMatches();
    String sql = "SELECT 1 FROM versus_matches " +
        "WHERE status = 'PENDING' AND " +
        "((challenger_id = ? AND opponent_id = ?) OR (challenger_id = ? AND opponent_id = ?)) LIMIT 1";
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setLong(1, firstUserId);
      statement.setLong(2, secondUserId);
      statement.setLong(3, secondUserId);
      statement.setLong(4, firstUserId);
      try (ResultSet row = statement.executeQuery()) { return row.next(); }
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot check pending match", ex);
    }
  }

  public void respondFriendRequest(long requestId, AppUser receiver, boolean accept) {
    try (Connection connection = database.connection()) {
      connection.setAutoCommit(false);
      try (PreparedStatement request = connection.prepareStatement(
          "SELECT sender_id, receiver_id FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = 'PENDING'")) {
        request.setLong(1, requestId);
        request.setLong(2, receiver.getId());
        try (ResultSet row = request.executeQuery()) {
          if (!row.next()) throw new IllegalArgumentException("Zahtjev za prijateljstvo nije pronađen.");
          long senderId = row.getLong("sender_id");
          long receiverId = row.getLong("receiver_id");
          try (PreparedStatement update = connection.prepareStatement("UPDATE friend_requests SET status = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?")) {
            update.setString(1, accept ? "ACCEPTED" : "REJECTED");
            update.setLong(2, requestId);
            update.executeUpdate();
          }
          if (accept) {
            try (PreparedStatement friendship = connection.prepareStatement("INSERT IGNORE INTO friendships (user_one_id, user_two_id) VALUES (?, ?)")) {
              friendship.setLong(1, Math.min(senderId, receiverId));
              friendship.setLong(2, Math.max(senderId, receiverId));
              friendship.executeUpdate();
            }
          }
        }
      }
      connection.commit();
    } catch (IllegalArgumentException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot respond to friend request", ex);
    }
  }

  public MatchDto createMatch(AppUser challenger, AppUser opponent, String difficulty) {
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(
        "INSERT INTO versus_matches (challenger_id, opponent_id, difficulty) VALUES (?, ?, ?)", Statement.RETURN_GENERATED_KEYS)) {
      statement.setLong(1, challenger.getId());
      statement.setLong(2, opponent.getId());
      statement.setString(3, difficulty);
      statement.executeUpdate();
      try (ResultSet keys = statement.getGeneratedKeys()) {
        if (keys.next()) return match(keys.getLong(1), challenger.getId()).orElseThrow();
      }
      throw new IllegalStateException("Match id missing");
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot create match", ex);
    }
  }

  public void respondMatch(long matchId, AppUser opponent, boolean accept) {
    expirePendingMatches();
    String sql = "UPDATE versus_matches SET status = ?, responded_at = CURRENT_TIMESTAMP, round_started_at = IF(?, DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 1200000 MICROSECOND), round_started_at) WHERE id = ? AND opponent_id = ? AND status = 'PENDING'";
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setString(1, accept ? "ACCEPTED" : "REJECTED");
      statement.setBoolean(2, accept);
      statement.setLong(3, matchId);
      statement.setLong(4, opponent.getId());
      if (statement.executeUpdate() == 0) throw new IllegalArgumentException("Izazov nije pronađen.");
    } catch (IllegalArgumentException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot respond to match", ex);
    }
  }

  public Optional<MatchDto> match(long matchId, long participantId) {
    expirePendingMatches();
    String sql = matchSelect() + " WHERE m.id = ? AND (m.challenger_id = ? OR m.opponent_id = ?)";
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setLong(1, matchId);
      statement.setLong(2, participantId);
      statement.setLong(3, participantId);
      try (ResultSet row = statement.executeQuery()) { return row.next() ? Optional.of(mapMatch(row)) : Optional.empty(); }
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot read match", ex);
    }
  }

  public List<MatchDto> matches(AppUser user) {
    expirePendingMatches();
    List<MatchDto> result = new ArrayList<>();
    String sql = matchSelect() + " WHERE m.challenger_id = ? OR m.opponent_id = ? ORDER BY m.created_at DESC LIMIT 50";
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setLong(1, user.getId());
      statement.setLong(2, user.getId());
      try (ResultSet rows = statement.executeQuery()) { while (rows.next()) result.add(mapMatch(rows)); }
      return result;
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot read matches", ex);
    }
  }

  public VersusStatsDto versusStats(AppUser user) {
    int wins = 0;
    int losses = 0;
    int draws = 0;
    String sql = "SELECT challenger_id, opponent_id, challenger_score, opponent_score FROM versus_matches " +
        "WHERE (challenger_id = ? OR opponent_id = ?) AND challenger_score IS NOT NULL AND opponent_score IS NOT NULL";
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setLong(1, user.getId());
      statement.setLong(2, user.getId());
      try (ResultSet rows = statement.executeQuery()) {
        while (rows.next()) {
          boolean challenger = rows.getLong("challenger_id") == user.getId();
          int myScore = challenger ? rows.getInt("challenger_score") : rows.getInt("opponent_score");
          int opponentScore = challenger ? rows.getInt("opponent_score") : rows.getInt("challenger_score");
          if (myScore > opponentScore) wins++;
          else if (myScore < opponentScore) losses++;
          else draws++;
        }
      }
      return new VersusStatsDto(wins, losses, draws);
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot read versus stats", ex);
    }
  }

  public MatchDto saveQuestions(long matchId, AppUser user, String questionsJson) {
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(
        "UPDATE versus_matches SET questions_json = ? WHERE id = ? AND status = 'ACCEPTED' AND questions_json IS NULL AND (challenger_id = ? OR opponent_id = ?)")) {
      statement.setString(1, questionsJson);
      statement.setLong(2, matchId);
      statement.setLong(3, user.getId());
      statement.setLong(4, user.getId());
      statement.executeUpdate();
      return match(matchId, user.getId()).orElseThrow(() -> new IllegalArgumentException("Meč nije pronađen."));
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot save match questions", ex);
    }
  }

  public MatchDto saveScore(long matchId, AppUser user, int score) {
    MatchDto existing = match(matchId, user.getId()).orElseThrow(() -> new IllegalArgumentException("Meč nije pronađen."));
    boolean challenger = existing.getChallenger().getId().equals(user.getId());
    String column = challenger ? "challenger_score" : "opponent_score";
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(
        "UPDATE versus_matches SET " + column + " = ?, status = IF(challenger_score IS NOT NULL AND opponent_score IS NOT NULL, 'COMPLETED', status) WHERE id = ?")) {
      statement.setInt(1, score);
      statement.setLong(2, matchId);
      statement.executeUpdate();
      try (PreparedStatement completed = connection.prepareStatement(
          "UPDATE versus_matches SET status = 'COMPLETED' WHERE id = ? AND challenger_score IS NOT NULL AND opponent_score IS NOT NULL")) {
        completed.setLong(1, matchId);
        completed.executeUpdate();
      }
      return match(matchId, user.getId()).orElseThrow();
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot save match score", ex);
    }
  }

  public MatchDto saveAnswerState(long matchId, AppUser user, String answersJson, int challengerScore, int opponentScore, boolean completed, boolean startNextRoundTimer) {
    MatchDto existing = match(matchId, user.getId()).orElseThrow(() -> new IllegalArgumentException("Mec nije pronadjen."));
    boolean challenger = existing.getChallenger().getId().equals(user.getId());
    String answerColumn = challenger ? "challenger_answers_json" : "opponent_answers_json";
    String sql = "UPDATE versus_matches SET " + answerColumn + " = ?, challenger_score = ?, opponent_score = ?, status = ?, round_started_at = IF(?, DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 2600000 MICROSECOND), round_started_at) WHERE id = ?";
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setString(1, answersJson);
      statement.setInt(2, challengerScore);
      statement.setInt(3, opponentScore);
      statement.setString(4, completed ? "COMPLETED" : "ACCEPTED");
      statement.setBoolean(5, startNextRoundTimer);
      statement.setLong(6, matchId);
      statement.executeUpdate();
      return match(matchId, user.getId()).orElseThrow();
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot save match answer", ex);
    }
  }

  public MatchDto completeForfeit(long matchId, AppUser forfeitingUser, int winnerScore) {
    MatchDto existing = match(matchId, forfeitingUser.getId()).orElseThrow(() -> new IllegalArgumentException("Mec nije pronadjen."));
    if ("COMPLETED".equals(existing.getStatus())) return existing;
    if (!"ACCEPTED".equals(existing.getStatus())) throw new IllegalArgumentException("Mec nije aktivan.");

    boolean challengerForfeited = existing.getChallenger().getId().equals(forfeitingUser.getId());
    int challengerScore = challengerForfeited ? 0 : winnerScore;
    int opponentScore = challengerForfeited ? winnerScore : 0;

    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(
        "UPDATE versus_matches SET challenger_score = ?, opponent_score = ?, status = 'COMPLETED', responded_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'ACCEPTED'")) {
      statement.setInt(1, challengerScore);
      statement.setInt(2, opponentScore);
      statement.setLong(3, matchId);
      statement.executeUpdate();
      return match(matchId, forfeitingUser.getId()).orElseThrow();
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot complete forfeited match", ex);
    }
  }

  private List<FriendDto> friends(AppUser user) {
    List<FriendDto> result = new ArrayList<>();
    String sql = "SELECT u.id, u.username, u.best_score, u.total_score FROM friendships f JOIN users u ON u.id = IF(f.user_one_id = ?, f.user_two_id, f.user_one_id) WHERE f.user_one_id = ? OR f.user_two_id = ? ORDER BY u.username";
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setLong(1, user.getId()); statement.setLong(2, user.getId()); statement.setLong(3, user.getId());
      try (ResultSet rows = statement.executeQuery()) { while (rows.next()) result.add(friend(rows, "")); }
      return result;
    } catch (Exception ex) { throw new IllegalStateException("Cannot read friends", ex); }
  }

  private List<FriendRequestDto> requests(AppUser user, boolean incoming) {
    List<FriendRequestDto> result = new ArrayList<>();
    String side = incoming ? "receiver_id" : "sender_id";
    String join = incoming ? "sender_id" : "receiver_id";
    String sql = "SELECT fr.id request_id, fr.status, fr.created_at, u.id, u.username, u.best_score, u.total_score FROM friend_requests fr JOIN users u ON u.id = fr." + join + " WHERE fr." + side + " = ? AND fr.status = 'PENDING' ORDER BY fr.created_at DESC";
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setLong(1, user.getId());
      try (ResultSet rows = statement.executeQuery()) {
        while (rows.next()) result.add(new FriendRequestDto(rows.getLong("request_id"), friend(rows, ""), incoming ? "INCOMING" : "OUTGOING", rows.getString("status"), rows.getTimestamp("created_at").toLocalDateTime()));
      }
      return result;
    } catch (Exception ex) { throw new IllegalStateException("Cannot read friend requests", ex); }
  }

  private void expirePendingMatches() {
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(
        "UPDATE versus_matches SET status = 'REJECTED', responded_at = CURRENT_TIMESTAMP WHERE status = 'PENDING' AND created_at < (CURRENT_TIMESTAMP - INTERVAL " + MATCH_INVITE_TIMEOUT_SECONDS + " SECOND)")) {
      statement.executeUpdate();
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot expire pending matches", ex);
    }
  }

  private String matchSelect() {
    return "SELECT m.*, ROUND(UNIX_TIMESTAMP(m.round_started_at) * 1000) round_started_at_ms, ROUND(UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000) server_now_ms, c.username challenger_username, c.best_score challenger_best, c.total_score challenger_total, o.username opponent_username, o.best_score opponent_best, o.total_score opponent_total FROM versus_matches m JOIN users c ON c.id = m.challenger_id JOIN users o ON o.id = m.opponent_id";
  }

  private MatchDto mapMatch(ResultSet row) throws Exception {
    FriendDto challenger = new FriendDto(row.getLong("challenger_id"), row.getString("challenger_username"), row.getInt("challenger_best"), row.getInt("challenger_total"));
    FriendDto opponent = new FriendDto(row.getLong("opponent_id"), row.getString("opponent_username"), row.getInt("opponent_best"), row.getInt("opponent_total"));
    Timestamp created = row.getTimestamp("created_at");
    Timestamp roundStarted = row.getTimestamp("round_started_at");
    return new MatchDto(
        row.getLong("id"),
        challenger,
        opponent,
        row.getString("difficulty"),
        row.getString("status"),
        row.getString("questions_json"),
        row.getString("challenger_answers_json"),
        row.getString("opponent_answers_json"),
        nullableInt(row, "challenger_score"),
        nullableInt(row, "opponent_score"),
        created.toLocalDateTime(),
        roundStarted == null ? null : roundStarted.toLocalDateTime(),
        nullableLong(row, "round_started_at_ms"),
        nullableLong(row, "server_now_ms")
    );
  }

  private Integer nullableInt(ResultSet row, String column) throws Exception {
    int value = row.getInt(column);
    return row.wasNull() ? null : value;
  }

  private Long nullableLong(ResultSet row, String column) throws Exception {
    long value = row.getLong(column);
    return row.wasNull() ? null : value;
  }

  private FriendDto friend(ResultSet row, String prefix) throws Exception {
    return new FriendDto(row.getLong(prefix + "id"), row.getString(prefix + "username"), row.getInt(prefix + "best_score"), row.getInt(prefix + "total_score"));
  }

  private void execute(String sql, long first, long second) {
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setLong(1, first); statement.setLong(2, second); statement.executeUpdate();
    } catch (Exception ex) { throw new IllegalStateException("Cannot update social data", ex); }
  }
}
