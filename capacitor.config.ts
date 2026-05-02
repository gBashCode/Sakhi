import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sih.sakhiai',
  appName: 'Sakhi AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // For local dev with live reload, uncomment and set to your machine IP:
    // url: 'http://192.168.x.x:5173',
    // cleartext: true,
  },
  android: {
    allowMixedContent: true,  // allow http API calls during dev
    captureInput: true,
    webContentsDebuggingEnabled: true,  // enable Chrome DevTools remote debug
  },
  plugins: {
    // Microphone permission handled via AndroidManifest.xml
  },
};

export default config;
