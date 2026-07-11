package com.phrasesdetective.backend.dto;

import java.util.List;

public class FriendsStateDto {
  private List<FriendDto> friends;
  private List<FriendRequestDto> incomingRequests;
  private List<FriendRequestDto> outgoingRequests;

  public FriendsStateDto(List<FriendDto> friends, List<FriendRequestDto> incomingRequests, List<FriendRequestDto> outgoingRequests) {
    this.friends = friends;
    this.incomingRequests = incomingRequests;
    this.outgoingRequests = outgoingRequests;
  }

  public List<FriendDto> getFriends() { return friends; }
  public List<FriendRequestDto> getIncomingRequests() { return incomingRequests; }
  public List<FriendRequestDto> getOutgoingRequests() { return outgoingRequests; }
}
