export interface Environment {
  production: boolean;
  apiUrl: string;
  appName: string;
  version: string;
  features: {
    analytics: boolean;
    darkMode: boolean;
    multiLanguage: boolean;
  };
}

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  appName: 'GasTrack',
  version: '1.0.0',
  features: {
    analytics: false,
    darkMode: true,
    multiLanguage: false,
  },
};
