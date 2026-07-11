package com.phrasesdetective.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.AlarmManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.IBinder;
import android.os.SystemClock;

import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class NotificationPollService extends Service {
  public static final String ACTION_START = "com.phrasesdetective.app.NotificationPollService.START";
  public static final String ACTION_STOP = "com.phrasesdetective.app.NotificationPollService.STOP";
  public static final String EXTRA_API_URL = "apiUrl";
  public static final String EXTRA_TOKEN = "token";
  public static final String EXTRA_USERNAME = "username";
  public static final String EXTRA_INTERVAL_MS = "intervalMs";

  private static final String PREFS = "phrases_detective_native_notifications";
  private static final String CONFIG_API_URL = "config_api_url";
  private static final String CONFIG_TOKEN = "config_token";
  private static final String CONFIG_USERNAME = "config_username";
  private static final String CONFIG_INTERVAL_MS = "config_interval_ms";
  private static final String SEEN_FRIENDS = "seen_friend_requests";
  private static final String SEEN_MATCHES = "seen_matches";
  private static final String CHANNEL_STATUS = "phrases_detective_polling";
  private static final String CHANNEL_ALERTS = "phrases_detective_social_native";
  private static final int STATUS_NOTIFICATION_ID = 41001;

  private ScheduledExecutorService executor;
  private String apiUrl;
  private String token;
  private String username;
  private int intervalMs = 10000;

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    if (intent != null && ACTION_STOP.equals(intent.getAction())) {
      clearConfig();
      stopPolling();
      stopSelf();
      return START_NOT_STICKY;
    }

    if (intent != null && intent.hasExtra(EXTRA_TOKEN)) {
      apiUrl = intent.getStringExtra(EXTRA_API_URL);
      token = intent.getStringExtra(EXTRA_TOKEN);
      username = intent.getStringExtra(EXTRA_USERNAME);
      intervalMs = Math.max(5000, intent.getIntExtra(EXTRA_INTERVAL_MS, 10000));
      saveConfig();
    } else {
      loadConfig();
    }

    createChannels();
    startForeground(STATUS_NOTIFICATION_ID, statusNotification());
    startPolling();
    return START_STICKY;
  }

  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }

  @Override
  public void onDestroy() {
    stopPolling();
    super.onDestroy();
  }

  @Override
  public void onTaskRemoved(Intent rootIntent) {
    if (hasSavedConfig()) scheduleRestart();
    super.onTaskRemoved(rootIntent);
  }

  private void startPolling() {
    stopExecutor();
    executor = Executors.newSingleThreadScheduledExecutor();
    executor.scheduleWithFixedDelay(this::pollSafely, 0, intervalMs, TimeUnit.MILLISECONDS);
  }

  private void stopPolling() {
    stopExecutor();
    stopForeground(true);
  }

  private void stopExecutor() {
    if (executor != null) {
      executor.shutdownNow();
      executor = null;
    }
  }

  private void pollSafely() {
    try {
      if (apiUrl == null || apiUrl.isBlank() || token == null || token.isBlank()) return;
      JSONObject friends = getJson(apiUrl + "/friends");
      JSONArray matches = getArray(apiUrl + "/matches");
      handleFriendRequests(friends.optJSONArray("incomingRequests"));
      handleMatches(matches);
    } catch (Exception ignored) {
      // Background notifications must never crash the app.
    }
  }

  private void handleFriendRequests(JSONArray requests) {
    if (requests == null) return;

    SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
    Set<String> seen = new HashSet<>(prefs.getStringSet(SEEN_FRIENDS, new HashSet<>()));

    for (int i = 0; i < requests.length(); i++) {
      JSONObject request = requests.optJSONObject(i);
      if (request == null) continue;

      String id = String.valueOf(request.optLong("id"));
      boolean isNew = seen.add(id);
      if (isNew) {
        JSONObject user = request.optJSONObject("user");
        String sender = user != null ? user.optString("username", "Igrac") : "Igrac";
        showAlert(100000 + request.optInt("id"), "Novi zahtjev za prijateljstvo", sender + " ti je poslao zahtjev.");
      }
    }

    prefs.edit().putStringSet(SEEN_FRIENDS, seen).apply();
  }

  private void handleMatches(JSONArray matches) {
    if (matches == null) return;

    SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
    Set<String> seen = new HashSet<>(prefs.getStringSet(SEEN_MATCHES, new HashSet<>()));

    for (int i = 0; i < matches.length(); i++) {
      JSONObject match = matches.optJSONObject(i);
      if (match == null) continue;

      String status = match.optString("status");
      JSONObject challenger = match.optJSONObject("challenger");
      JSONObject opponent = match.optJSONObject("opponent");
      String opponentUsername = opponent != null ? opponent.optString("username", "") : "";

      if ("PENDING".equals(status) && username.equals(opponentUsername)) {
        String id = String.valueOf(match.optLong("id"));
        boolean isNew = seen.add(id);
        if (isNew) {
          String displayName = challenger != null ? challenger.optString("username", "Igrac") : "Igrac";
          String difficulty = match.optString("difficulty", "");
          showAlert(200000 + match.optInt("id"), "Novi Versus poziv", displayName + " te izazvao na " + difficulty + " mec.");
        }
      }

    }

    prefs.edit()
        .putStringSet(SEEN_MATCHES, seen)
        .apply();
  }

  private JSONObject getJson(String endpoint) throws Exception {
    return new JSONObject(get(endpoint));
  }

  private JSONArray getArray(String endpoint) throws Exception {
    return new JSONArray(get(endpoint));
  }

  private String get(String endpoint) throws Exception {
    HttpURLConnection connection = (HttpURLConnection) new URL(endpoint).openConnection();
    connection.setConnectTimeout(5000);
    connection.setReadTimeout(5000);
    connection.setRequestMethod("GET");
    connection.setRequestProperty("Authorization", "Bearer " + token);
    connection.setRequestProperty("Content-Type", "application/json");

    int status = connection.getResponseCode();
    InputStream stream = status >= 200 && status < 300 ? connection.getInputStream() : connection.getErrorStream();
    try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
      StringBuilder body = new StringBuilder();
      String line;
      while ((line = reader.readLine()) != null) body.append(line);
      if (status < 200 || status >= 300) throw new IllegalStateException("HTTP " + status);
      return body.toString();
    } finally {
      connection.disconnect();
    }
  }

  private void showAlert(int id, String title, String body) {
    Notification notification = new NotificationCompat.Builder(this, CHANNEL_ALERTS)
        .setSmallIcon(R.mipmap.ic_launcher)
        .setLargeIcon(android.graphics.BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher))
        .setColor(0xff2563eb)
        .setContentTitle(title)
        .setContentText(body)
        .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
        .setContentIntent(openAppIntent())
        .setAutoCancel(true)
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setDefaults(NotificationCompat.DEFAULT_ALL)
        .build();

    NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
    manager.notify(id, notification);
  }

  private Notification statusNotification() {
    return new NotificationCompat.Builder(this, CHANNEL_STATUS)
        .setSmallIcon(R.mipmap.ic_launcher)
        .setLargeIcon(android.graphics.BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher))
        .setColor(0xff2563eb)
        .setContentTitle("Phrases Detective")
        .setContentIntent(openAppIntent())
        .setOngoing(true)
        .setPriority(NotificationCompat.PRIORITY_LOW)
        .build();
  }

  private PendingIntent openAppIntent() {
    Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
    int flags = PendingIntent.FLAG_UPDATE_CURRENT;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
    return PendingIntent.getActivity(this, 0, launchIntent, flags);
  }

  private void createChannels() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

    NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
    NotificationChannel status = new NotificationChannel(CHANNEL_STATUS, "Phrases Detective servis", NotificationManager.IMPORTANCE_LOW);
    status.setDescription("Odrzava provjeru notifikacija aktivnom u pozadini.");
    manager.createNotificationChannel(status);

    NotificationChannel alerts = new NotificationChannel(CHANNEL_ALERTS, "Phrases Detective notifikacije", NotificationManager.IMPORTANCE_HIGH);
    alerts.setDescription("Zahtjevi za prijateljstvo i Versus pozivi.");
    alerts.enableVibration(true);
    manager.createNotificationChannel(alerts);
  }

  private void saveConfig() {
    getSharedPreferences(PREFS, MODE_PRIVATE)
        .edit()
        .putString(CONFIG_API_URL, apiUrl == null ? "" : apiUrl)
        .putString(CONFIG_TOKEN, token == null ? "" : token)
        .putString(CONFIG_USERNAME, username == null ? "" : username)
        .putInt(CONFIG_INTERVAL_MS, intervalMs)
        .apply();
  }

  private void loadConfig() {
    SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
    apiUrl = prefs.getString(CONFIG_API_URL, "");
    token = prefs.getString(CONFIG_TOKEN, "");
    username = prefs.getString(CONFIG_USERNAME, "");
    intervalMs = Math.max(5000, prefs.getInt(CONFIG_INTERVAL_MS, 10000));
  }

  private void clearConfig() {
    getSharedPreferences(PREFS, MODE_PRIVATE)
        .edit()
        .remove(CONFIG_API_URL)
        .remove(CONFIG_TOKEN)
        .remove(CONFIG_USERNAME)
        .remove(CONFIG_INTERVAL_MS)
        .apply();
  }

  private boolean hasSavedConfig() {
    return !getSharedPreferences(PREFS, MODE_PRIVATE).getString(CONFIG_TOKEN, "").isBlank();
  }

  private void scheduleRestart() {
    Intent restartIntent = new Intent(getApplicationContext(), NotificationPollService.class);
    restartIntent.setAction(ACTION_START);
    int flags = PendingIntent.FLAG_UPDATE_CURRENT;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
    PendingIntent pendingIntent = PendingIntent.getService(getApplicationContext(), 41002, restartIntent, flags);
    AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
    alarmManager.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, SystemClock.elapsedRealtime() + 1000, pendingIntent);
  }
}
