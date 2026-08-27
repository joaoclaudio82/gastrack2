/**
 * Per-user application preferences (mirrors backend UserPreferencesResponse).
 */
export interface UserPreferences {
  analyticsRefreshIntervalSeconds: number;
  analyticsStreamingPaused: boolean;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  analyticsRefreshIntervalSeconds: 5,
  analyticsStreamingPaused: false,
};

export const ANALYTICS_REFRESH_MIN_SECONDS = 1;
export const ANALYTICS_REFRESH_MAX_SECONDS = 30;
