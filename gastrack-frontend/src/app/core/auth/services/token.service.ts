import { Injectable, inject } from '@angular/core';
import { StorageService } from '../../services/storage.service';

interface TokenPayload {
  exp: number;
  iat: number;
  sub: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly storage = inject(StorageService);
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly ID_TOKEN_KEY = 'id_token';

  getAccessToken(): string | null {
    return this.storage.get(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return this.storage.get(this.REFRESH_TOKEN_KEY);
  }

  getIdToken(): string | null {
    return this.storage.get(this.ID_TOKEN_KEY);
  }

  setTokens(accessToken: string, refreshToken: string, idToken?: string): void {
    this.storage.set(this.ACCESS_TOKEN_KEY, accessToken);
    this.storage.set(this.REFRESH_TOKEN_KEY, refreshToken);
    if (idToken) {
      this.storage.set(this.ID_TOKEN_KEY, idToken);
    }
  }

  clearTokens(): void {
    this.storage.remove(this.ACCESS_TOKEN_KEY);
    this.storage.remove(this.REFRESH_TOKEN_KEY);
    this.storage.remove(this.ID_TOKEN_KEY);
  }

  isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) return true;

    // Add 60 second buffer
    return payload.exp * 1000 < Date.now() + 60000;
  }

  getTokenExpirationDate(token: string): Date | null {
    const payload = this.decodeToken(token);
    if (!payload) return null;

    return new Date(payload.exp * 1000);
  }

  decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      const base64Url = parts[1];
      if (!base64Url) return null;

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload) as TokenPayload;
    } catch {
      return null;
    }
  }
}
