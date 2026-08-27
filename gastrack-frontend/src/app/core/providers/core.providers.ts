import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { errorInterceptor } from '../auth/interceptors/error.interceptor';
import { jwtInterceptor } from '../auth/interceptors/jwt.interceptor';

export function provideCoreServices(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(withFetch(), withInterceptors([jwtInterceptor, errorInterceptor])),
  ]);
}
