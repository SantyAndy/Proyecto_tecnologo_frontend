import type { CapacitorConfig } from '@capacitor/cli';

/**
 * App nativa (Android / iOS) generada con Capacitor a partir del mismo
 * código Angular. Se compila con `npm run app:android` (ver README).
 */
const config: CapacitorConfig = {
  appId: 'co.edu.fet.cafemonitor',
  appName: 'Café Monitor',
  // Build estático sin SSR ni service worker (configuración "app" de angular.json).
  webDir: 'dist/app/browser',
  server: {
    androidScheme: 'https',
    // Permite llamar a Django por http:// en la red local mientras no haya HTTPS.
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1f8f3a',
    },
  },
};

export default config;
