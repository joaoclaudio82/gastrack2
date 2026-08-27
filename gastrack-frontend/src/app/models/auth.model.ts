/**
 * Company reference in user context
 */
export interface UserCompany {
  id: number;
  name: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | undefined;
  roles: string[];
  /** Vem de GET /users/me — o banco é a fonte. O ID token não carrega a empresa. */
  companyId?: number | undefined;
  company?: UserCompany | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  tokenType: string | null;
  /** Present when authentication requires additional steps (e.g., NEW_PASSWORD_REQUIRED) */
  challengeName?: string | null;
  /** Session token required to respond to the challenge */
  session?: string | null;
  /** User profile from local database */
  firstName?: string | null;
  lastName?: string | null;
}

export interface RespondChallengeRequest {
  username: string;
  newPassword: string;
  session: string;
  challengeName: string;
}

export interface ChallengeContext {
  username: string;
  session: string;
  challengeName: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface RegisterResponse {
  userSub: string;
  userConfirmed: boolean;
  message: string;
}

export interface ConfirmRequest {
  username: string;
  confirmationCode: string;
}

export interface ConfirmResponse {
  confirmed: boolean;
  message: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  username: string;
}

export interface ResetPasswordRequest {
  username: string;
  confirmationCode: string;
  newPassword: string;
}
