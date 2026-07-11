import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { api, getApiBaseUrl, getToken } from './api';

let initialized = false;
let pollTimer = null;
let seenFriendRequests = new Set();
let seenMatches = new Set();

const POLL_INTERVAL_MS = 10000;
const FRIEND_REQUESTS_KEY = 'phrases_detective_seen_friend_requests';
const MATCHES_KEY = 'phrases_detective_seen_matches';
const CHANNEL_ID = 'phrases_detective_social';
const NotificationPoller = registerPlugin('NotificationPoller');

function readSeenSet(key) {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) || '[]'));
  } catch {
    return new Set();
  }
}

function saveSeenSet(key, values) {
  localStorage.setItem(key, JSON.stringify([...values].slice(-100)));
}

function notificationId(prefix, id) {
  const numericId = Number(id) || 0;
  return prefix + (numericId % 100000);
}

async function requestLocalNotificationPermission(LocalNotifications) {
  const current = await LocalNotifications.checkPermissions();
  if (current.display === 'granted') return true;

  const requested = await LocalNotifications.requestPermissions();
  return requested.display === 'granted';
}

async function ensureAndroidChannel(LocalNotifications) {
  if (Capacitor.getPlatform() !== 'android') return;

  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: 'Phrases Detective',
    description: 'Zahtjevi za prijateljstvo i Versus pozivi',
    importance: 5,
    visibility: 1,
    lights: true,
    vibration: true,
  });
}

async function showLocalNotification(LocalNotifications, notification) {
  await LocalNotifications.schedule({
    notifications: [{
      id: notification.id,
      title: notification.title,
      body: notification.body,
      channelId: CHANNEL_ID,
      smallIcon: 'ic_launcher',
      largeIcon: 'ic_launcher',
      iconColor: '#2563eb',
      extra: { type: notification.type },
      schedule: { at: new Date(Date.now() + 250) },
    }],
  });
}

function isIncomingPendingMatch(match, username) {
  return match?.status === 'PENDING' && match?.opponent?.username === username;
}

async function checkForSocialNotifications(LocalNotifications, username, firstRun = false) {
  const [friendsState, matches] = await Promise.all([api.friends(), api.matches()]);

  for (const request of friendsState.incomingRequests || []) {
    const key = String(request.id);
    const isNew = !seenFriendRequests.has(key);
    seenFriendRequests.add(key);

    if (!firstRun && isNew) {
      await showLocalNotification(LocalNotifications, {
        id: notificationId(100000, request.id),
        title: 'Novi zahtjev za prijateljstvo',
        body: `${request.user?.username || 'Igrač'} ti je poslao zahtjev.`,
        type: 'friends',
      });
    }
  }

  for (const match of matches || []) {
    if (isIncomingPendingMatch(match, username)) {
      const key = String(match.id);
      const isNew = !seenMatches.has(key);
      seenMatches.add(key);

      if (!firstRun && isNew) {
        await showLocalNotification(LocalNotifications, {
          id: notificationId(200000, match.id),
          title: 'Novi Versus poziv',
          body: `${match.challenger?.username || 'Igrač'} te izazvao na ${match.difficulty} meč.`,
          type: 'match',
        });
      }
    }

  }

  saveSeenSet(FRIEND_REQUESTS_KEY, seenFriendRequests);
  saveSeenSet(MATCHES_KEY, seenMatches);
}

async function startNativeBackgroundPolling(user) {
  if (Capacitor.getPlatform() !== 'android') return false;

  try {
    await NotificationPoller.start({
      apiUrl: getApiBaseUrl(),
      token: getToken(),
      username: user?.username || '',
      intervalMs: POLL_INTERVAL_MS,
    });
    return true;
  } catch {
    return false;
  }
}

export async function setupMobilePushNotifications(user) {
  if (import.meta.env.VITE_ENABLE_PUSH === 'false') return;
  if (initialized || !getToken() || !Capacitor.isNativePlatform()) return;

  initialized = true;

  try {
    const hasPermission = await requestLocalNotificationPermission(LocalNotifications);
    if (!hasPermission) return;

    await ensureAndroidChannel(LocalNotifications);

    seenFriendRequests = readSeenSet(FRIEND_REQUESTS_KEY);
    seenMatches = readSeenSet(MATCHES_KEY);

    await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
      const type = event.notification?.extra?.type || event.notification?.data?.type;
      if (type === 'friends' || type === 'match') {
        window.location.href = '/friends';
      }
    });

    if (await startNativeBackgroundPolling(user)) return;

    await checkForSocialNotifications(LocalNotifications, user?.username, true);
    pollTimer = window.setInterval(() => {
      if (!getToken()) return;
      checkForSocialNotifications(LocalNotifications, user?.username).catch(() => {});
    }, POLL_INTERVAL_MS);
  } catch {
    initialized = false;
  }
}

export function resetMobilePushSetup() {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    NotificationPoller.stop().catch(() => {});
  }

  if (pollTimer) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
  initialized = false;
}
