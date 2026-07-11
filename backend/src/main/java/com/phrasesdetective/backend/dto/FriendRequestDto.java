package com.phrasesdetective.backend.dto;

import java.time.LocalDateTime;

public class FriendRequestDto {
  private Long id;
  private FriendDto user;
  private String direction;
  private String status;
  private LocalDateTime createdAt;

  public FriendRequestDto(Long id, FriendDto user, String direction, String status, LocalDateTime createdAt) {
    this.id = id;
    this.user = user;
    this.direction = direction;
    this.status = status;
    this.createdAt = createdAt;
  }

  public Long getId() { return id; }
  public FriendDto getUser() { return user; }
  public String getDirection() { return direction; }
  public String getStatus() { return status; }
  public LocalDateTime getCreatedAt() { return createdAt; }
}
