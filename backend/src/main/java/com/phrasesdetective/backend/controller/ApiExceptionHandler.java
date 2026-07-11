package com.phrasesdetective.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
    return error(HttpStatus.BAD_REQUEST, ex.getMessage());
  }

  private ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
    Map<String, String> body = new HashMap<>();
    body.put("error", message);
    return ResponseEntity.status(status).body(body);
  }
}
