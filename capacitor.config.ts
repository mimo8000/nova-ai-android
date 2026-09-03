import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.novaai.app',
  appName: 'Nova AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
