import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  get(key: string): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(key);
  }

  set(key: string, value: string): void {
    if (!this.isBrowser) return;
    localStorage.setItem(key, value);
  }

  remove(key: string): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(key);
  }

  clear(): void {
    if (!this.isBrowser) return;
    localStorage.clear();
  }

  getObject<T>(key: string): T | null {
    const item = this.get(key);
    if (!item) return null;

    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }

  setObject<T>(key: string, value: T): void {
    this.set(key, JSON.stringify(value));
  }

  // Session storage methods
  getSession(key: string): string | null {
    if (!this.isBrowser) return null;
    return sessionStorage.getItem(key);
  }

  setSession(key: string, value: string): void {
    if (!this.isBrowser) return;
    sessionStorage.setItem(key, value);
  }

  removeSession(key: string): void {
    if (!this.isBrowser) return;
    sessionStorage.removeItem(key);
  }

  clearSession(): void {
    if (!this.isBrowser) return;
    sessionStorage.clear();
  }
}
