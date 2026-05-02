import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.asomi.sakhi',
  appName: 'SakhiAI',
  webDir: 'dist',
  server: {
    androidScheme: 'https', // CRITICAL FIX
    cleartext: true
  }
};

export default config;
