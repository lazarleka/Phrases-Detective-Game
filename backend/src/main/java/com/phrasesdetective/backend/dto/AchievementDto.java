package com.phrasesdetective.backend.dto;

import java.time.LocalDateTime;

public class AchievementDto {
  private Long id;
  private String code;
  private String name;
  private String description;
  private String icon;
  private boolean unlocked;
  private LocalDateTime unlockedAt;

  public AchievementDto(Long id, String code, String name, String description, String icon, boolean unlocked, LocalDateTime unlockedAt) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.description = description;
    this.icon = icon;
    this.unlocked = unlocked;
    this.unlockedAt = unlockedAt;
  }

  public Long getId() { return id; }
  public String getCode() { return code; }
  public String getName() { return name; }
  public String getDescription() { return description; }
  public String getIcon() { return icon; }
  public boolean isUnlocked() { return unlocked; }
  public LocalDateTime getUnlockedAt() { return unlockedAt; }
}
