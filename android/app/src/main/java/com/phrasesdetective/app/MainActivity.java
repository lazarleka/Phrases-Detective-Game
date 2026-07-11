package com.phrasesdetective.app;

import com.getcapacitor.BridgeActivity;

import android.webkit.WebSettings;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(android.os.Bundle savedInstanceState) {
    registerPlugin(NotificationPollPlugin.class);
    super.onCreate(savedInstanceState);
  }

  @Override
  protected void load() {
    super.load();
    getBridge().getWebView().getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
  }
}
