package com.phrasesdetective.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class JwtService {
  private static final Pattern SUBJECT_PATTERN = Pattern.compile("\"sub\":\"([^\"]+)\"");
  private static final Pattern EXPIRATION_PATTERN = Pattern.compile("\"exp\":(\\d+)");

  private final String secret;
  private final long expirationMs;

  public JwtService(
      @Value("${app.jwt.secret}") String secret,
      @Value("${app.jwt.expiration-ms}") long expirationMs
  ) {
    this.secret = secret;
    this.expirationMs = expirationMs;
  }

  public String generateToken(String username) {
    long nowSeconds = Instant.now().getEpochSecond();
    long expirationSeconds = nowSeconds + (expirationMs / 1000);

    String header = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
    String payload = "{\"sub\":\"" + escape(username) + "\",\"iat\":" + nowSeconds + ",\"exp\":" + expirationSeconds + "}";
    String unsignedToken = base64Url(header.getBytes(StandardCharsets.UTF_8)) + "." + base64Url(payload.getBytes(StandardCharsets.UTF_8));
    return unsignedToken + "." + base64Url(hmacSha256(unsignedToken));
  }

  public String requireValidToken(String token) {
    if (!isTokenValid(token)) {
      throw new IllegalArgumentException("Neispravan ili istekao token.");
    }
    return extractUsername(token);
  }

  private boolean isTokenValid(String token) {
    String[] parts = token.split("\\.");
    if (parts.length != 3) {
      return false;
    }

    String unsignedToken = parts[0] + "." + parts[1];
    String expectedSignature = base64Url(hmacSha256(unsignedToken));

    return constantTimeEquals(expectedSignature, parts[2]) && !isExpired(token);
  }

  private String extractUsername(String token) {
    Matcher matcher = SUBJECT_PATTERN.matcher(payload(token));
    if (!matcher.find()) {
      throw new IllegalArgumentException("Token nema korisnika.");
    }
    return matcher.group(1).replace("\\\"", "\"").replace("\\\\", "\\");
  }

  private boolean isExpired(String token) {
    Matcher matcher = EXPIRATION_PATTERN.matcher(payload(token));
    if (!matcher.find()) {
      return true;
    }
    long expirationSeconds = Long.parseLong(matcher.group(1));
    return expirationSeconds < Instant.now().getEpochSecond();
  }

  private String payload(String token) {
    try {
      String[] parts = token.split("\\.");
      if (parts.length != 3) {
        throw new IllegalArgumentException("Invalid token");
      }
      byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
      return new String(decoded, StandardCharsets.UTF_8);
    } catch (Exception ex) {
      throw new IllegalArgumentException("Invalid token");
    }
  }

  private String escape(String value) {
    return value.replace("\\", "\\\\").replace("\"", "\\\"");
  }

  private byte[] hmacSha256(String value) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot sign token", ex);
    }
  }

  private String base64Url(byte[] bytes) {
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private boolean constantTimeEquals(String left, String right) {
    if (left.length() != right.length()) {
      return false;
    }

    int result = 0;
    for (int i = 0; i < left.length(); i++) {
      result |= left.charAt(i) ^ right.charAt(i);
    }
    return result == 0;
  }
}
