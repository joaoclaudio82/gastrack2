import { Injectable } from '@angular/core';
import { environment } from '@env';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  get production(): boolean {
    return environment.production;
  }

  get apiUrl(): string {
    return environment.apiUrl;
  }

  get appName(): string {
    return environment.appName;
  }

  get version(): string {
    return environment.version;
  }

  get features() {
    return environment.features;
  }

  isFeatureEnabled(feature: keyof typeof environment.features): boolean {
    return environment.features[feature];
  }
}
