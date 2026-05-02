import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.asomi.sakhi',
  appName: 'SakhiAI',
  webDir: 'dist',
  server: {
    androidScheme: 'http', // CRITICAL FIX: Allow HTTP requests to backend
    cleartext: true,
    allowNavigation: ['huggingface.co', '*.huggingface.co']
  }
};

export default config;
