CREATE DATABASE IF NOT EXISTS phrases_detective
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE phrases_detective;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(40) NOT NULL UNIQUE,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'USER',
  games_played INT NOT NULL DEFAULT 0,
  total_score INT NOT NULL DEFAULT 0,
  best_score INT NOT NULL DEFAULT 0,
  total_correct INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  mode VARCHAR(20) NOT NULL,
  score INT NOT NULL,
  total_questions INT NOT NULL,
  duration_seconds INT NOT NULL,
  bonus_points INT NOT NULL DEFAULT 0,
  max_streak INT NOT NULL DEFAULT 0,
  answer_history_json LONGTEXT NULL,
  played_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_game_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS achievements (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(80) NOT NULL,
  description VARCHAR(255) NOT NULL,
  icon VARCHAR(40) NOT NULL,
  requirement_type VARCHAR(40) NOT NULL,
  requirement_value INT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id BIGINT NOT NULL,
  achievement_id BIGINT NOT NULL,
  unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, achievement_id),
  CONSTRAINT fk_user_achievements_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_achievements_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_challenges (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  challenge_date DATE NOT NULL UNIQUE,
  difficulty VARCHAR(20) NOT NULL,
  target_score INT NOT NULL,
  reward_points INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_daily_challenges (
  user_id BIGINT NOT NULL,
  challenge_id BIGINT NOT NULL,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  achieved_score INT NOT NULL,
  PRIMARY KEY (user_id, challenge_id),
  CONSTRAINT fk_user_daily_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_daily_challenge FOREIGN KEY (challenge_id) REFERENCES daily_challenges(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS friend_requests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sender_id BIGINT NOT NULL,
  receiver_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP NULL,
  UNIQUE KEY uq_friend_request (sender_id, receiver_id),
  CONSTRAINT fk_friend_request_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_friend_request_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS friendships (
  user_one_id BIGINT NOT NULL,
  user_two_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_one_id, user_two_id),
  CONSTRAINT fk_friendship_one FOREIGN KEY (user_one_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_friendship_two FOREIGN KEY (user_two_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS push_tokens (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  token VARCHAR(512) NOT NULL UNIQUE,
  platform VARCHAR(40) NOT NULL DEFAULT 'android',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_push_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS phrases (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  phrase VARCHAR(160) NOT NULL UNIQUE,
  category VARCHAR(60) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  correct_answer VARCHAR(255) NOT NULL,
  wrong_answer_1 VARCHAR(255) NOT NULL,
  wrong_answer_2 VARCHAR(255) NOT NULL,
  wrong_answer_3 VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phrases_difficulty (difficulty),
  INDEX idx_phrases_category (category)
);

CREATE TABLE IF NOT EXISTS versus_matches (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  challenger_id BIGINT NOT NULL,
  opponent_id BIGINT NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  questions_json LONGTEXT NULL,
  challenger_answers_json LONGTEXT NULL,
  opponent_answers_json LONGTEXT NULL,
  challenger_score INT NULL,
  opponent_score INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP NULL,
  round_started_at TIMESTAMP(3) NULL,
  CONSTRAINT fk_match_challenger FOREIGN KEY (challenger_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_match_opponent FOREIGN KEY (opponent_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT IGNORE INTO achievements (code, name, description, icon, requirement_type, requirement_value) VALUES
  ('FIRST_GAME', 'Prvi trag', 'Zavrsi svoju prvu partiju.', 'search', 'GAMES_PLAYED', 1),
  ('FIVE_GAMES', 'Iskusni detektiv', 'Zavrsi 5 partija.', 'badge', 'GAMES_PLAYED', 5),
  ('TEN_GAMES', 'Uporni istrazitelj', 'Zavrsi 10 partija.', 'badge', 'GAMES_PLAYED', 10),
  ('TWENTY_FIVE_GAMES', 'Veteran fraza', 'Zavrsi 25 partija.', 'crown', 'GAMES_PLAYED', 25),
  ('FIFTY_GAMES', 'Glavni detektiv', 'Zavrsi 50 partija.', 'crown', 'GAMES_PLAYED', 50),
  ('PERFECT_GAME', 'Bez greske', 'Osvoji maksimalan rezultat u jednoj partiji.', 'crown', 'PERFECT_GAME', 1),
  ('SCORE_FIVE', 'Dobar pocetak', 'Osvoji najmanje 5 poena u jednoj partiji.', 'target', 'BEST_SCORE', 5),
  ('SCORE_EIGHT', 'Ostro oko', 'Osvoji najmanje 8 poena u jednoj partiji.', 'target', 'BEST_SCORE', 8),
  ('SCORE_TEN', 'Majstor fraza', 'Osvoji 10 poena u jednoj partiji.', 'trophy', 'BEST_SCORE', 10),
  ('TEN_CORRECT', 'Prvih deset', 'Odgovori tačno na 10 pitanja.', 'target', 'TOTAL_CORRECT', 10),
  ('FIFTY_CORRECT', 'Lovac na fraze', 'Odgovori tačno na 50 pitanja.', 'target', 'TOTAL_CORRECT', 50),
  ('HUNDRED_CORRECT', 'Enciklopedija fraza', 'Odgovori tačno na 100 pitanja.', 'trophy', 'TOTAL_CORRECT', 100),
  ('FIVE_HUNDRED_CORRECT', 'Nepogrešivi detektiv', 'Odgovori tačno na 500 pitanja.', 'crown', 'TOTAL_CORRECT', 500),
  ('FIFTY_POINTS', 'Skupljac poena', 'Osvoji ukupno 50 poena.', 'trophy', 'TOTAL_SCORE', 50),
  ('HUNDRED_POINTS', 'Stotka', 'Osvoji ukupno 100 poena.', 'trophy', 'TOTAL_SCORE', 100),
  ('FIVE_HUNDRED_POINTS', 'Elitni detektiv', 'Osvoji ukupno 500 poena.', 'crown', 'TOTAL_SCORE', 500),
  ('THOUSAND_POINTS', 'Legenda fraza', 'Osvoji ukupno 1000 poena.', 'crown', 'TOTAL_SCORE', 1000),
  ('DAILY_CHALLENGE', 'Dnevni istrazitelj', 'Zavrsi jedan dnevni izazov.', 'calendar', 'DAILY_COMPLETED', 1);
