package com.phrasesdetective.app;

import android.content.Intent;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NotificationPoller")
public class NotificationPollPlugin extends Plugin {
  @PluginMethod
  public void start(PluginCall call) {
    String apiUrl = call.getString("apiUrl", "");
    String token = call.getString("token", "");
    String username = call.getString("username", "");
    int intervalMs = call.getInt("intervalMs", 10000);

    if (apiUrl.isBlank() || token.isBlank()) {
      call.reject("Missing API URL or auth token.");
      return;
    }

    Intent intent = new Intent(getContext(), NotificationPollService.class);
    intent.setAction(NotificationPollService.ACTION_START);
    intent.putExtra(NotificationPollService.EXTRA_API_URL, apiUrl);
    intent.putExtra(NotificationPollService.EXTRA_TOKEN, token);
    intent.putExtra(NotificationPollService.EXTRA_USERNAME, username);
    intent.putExtra(NotificationPollService.EXTRA_INTERVAL_MS, intervalMs);
    ContextCompat.startForegroundService(getContext(), intent);

    JSObject result = new JSObject();
    result.put("ok", true);
    call.resolve(result);
  }

  @PluginMethod
  public void stop(PluginCall call) {
    Intent intent = new Intent(getContext(), NotificationPollService.class);
    intent.setAction(NotificationPollService.ACTION_STOP);
    getContext().startService(intent);

    JSObject result = new JSObject();
    result.put("ok", true);
    call.resolve(result);
  }
}
