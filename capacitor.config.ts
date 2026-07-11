import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.phrasesdetective.app',
  appName: 'Phrases Detective',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#eff6ff',
      showSpinner: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_launcher',
      iconColor: '#2563eb',
    },
  },
};

export default config;
