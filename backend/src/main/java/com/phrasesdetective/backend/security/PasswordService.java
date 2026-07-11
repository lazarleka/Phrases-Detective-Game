package com.phrasesdetective.backend.security;

import org.springframework.stereotype.Service;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class PasswordService {
  private static final int ITERATIONS = 120000;
  private static final int KEY_LENGTH = 256;
  private static final SecureRandom RANDOM = new SecureRandom();

  public String hash(String password) {
    byte[] salt = new byte[16];
    RANDOM.nextBytes(salt);
    byte[] hash = pbkdf2(password, salt);
    return ITERATIONS + ":" + Base64.getEncoder().encodeToString(salt) + ":" + Base64.getEncoder().encodeToString(hash);
  }

  public boolean matches(String password, String storedHash) {
    String[] parts = storedHash.split(":");
    if (parts.length != 3) {
      return false;
    }

    byte[] salt = Base64.getDecoder().decode(parts[1]);
    byte[] expected = Base64.getDecoder().decode(parts[2]);
    byte[] actual = pbkdf2(password, salt);
    return constantTimeEquals(expected, actual);
  }

  private byte[] pbkdf2(String password, byte[] salt) {
    try {
      PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, KEY_LENGTH);
      return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot hash password", ex);
    }
  }

  private boolean constantTimeEquals(byte[] left, byte[] right) {
    if (left.length != right.length) {
      return false;
    }

    int result = 0;
    for (int i = 0; i < left.length; i++) {
      result |= left[i] ^ right[i];
    }
    return result == 0;
  }
}
