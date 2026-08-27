# Auth Domain - Frontend

## Scope

User authentication, session management, password recovery, and account confirmation. Uses JWT-based authentication with Cognito backend.

---

## Structure

```
src/app/features/auth/
├── pages/
│   ├── login/
│   │   └── login.component.ts
│   ├── confirm-account/
│   │   └── confirm-account.component.ts
│   ├── forgot-password/
│   │   └── forgot-password.component.ts
│   └── reset-password/
│       └── reset-password.component.ts
├── auth.routes.ts
└── AGENTS.md
```

---

## Components

| Component                 | Type  | Location                 | Description                    |
| ------------------------- | ----- | ------------------------ | ------------------------------ |
| `LoginComponent`          | Smart | `pages/login/`           | Login form with email/password |
| `ConfirmAccountComponent` | Smart | `pages/confirm-account/` | Email confirmation code entry  |
| `ForgotPasswordComponent` | Smart | `pages/forgot-password/` | Request password reset         |
| `ResetPasswordComponent`  | Smart | `pages/reset-password/`  | Set new password with code     |

### LoginComponent

**Features:**

- Email/password form with validation
- Remember me checkbox
- Error display from AuthService
- Redirect to returnUrl after login
- Auto-redirect to confirm-account if user not confirmed

**Form Fields:**

- `username` (email): required, email format
- `password`: required, min 6 characters
- `rememberMe`: boolean

### ConfirmAccountComponent

**Features:**

- Confirmation code input (6 digits)
- Resend code functionality
- Success redirect to login

### ForgotPasswordComponent

**Features:**

- Email input to request reset code
- Success message with instructions

### ResetPasswordComponent

**Features:**

- Code input
- New password input with validation
- Password confirmation
- Success redirect to login

---

## Core Services

**Location:** `@core/auth/services/`

### AuthService

**Signals:**

| Signal            | Type                     | Access   | Description       |
| ----------------- | ------------------------ | -------- | ----------------- |
| `currentUser`     | `Signal<User \| null>`   | readonly | Logged-in user    |
| `isAuthenticated` | `Signal<boolean>`        | computed | Auth status       |
| `isLoading`       | `Signal<boolean>`        | readonly | Loading state     |
| `error`           | `Signal<string \| null>` | readonly | Error message     |
| `userRoles`       | `Signal<string[]>`       | computed | User's roles      |
| `userFullName`    | `Signal<string>`         | computed | Full name display |

**Methods:**

| Method           | Parameters                 | Returns                        | Description                  |
| ---------------- | -------------------------- | ------------------------------ | ---------------------------- |
| `login`          | `LoginRequest`             | `Observable<LoginResponse>`    | Authenticate user            |
| `logout`         | -                          | `void`                         | Clear session, redirect      |
| `register`       | `RegisterRequest`          | `Observable<RegisterResponse>` | Create account               |
| `confirmAccount` | `ConfirmRequest`           | `Observable<ConfirmResponse>`  | Confirm email                |
| `forgotPassword` | `username: string`         | `Observable<{message}>`        | Request reset                |
| `resetPassword`  | `username, code, password` | `Observable<{message}>`        | Set new password             |
| `refreshSession` | -                          | `Observable<LoginResponse>`    | Refresh tokens               |
| `hasRole`        | `role: string`             | `boolean`                      | Check single role            |
| `hasAnyRole`     | `roles: string[]`          | `boolean`                      | Check any role               |
| `initializeAuth` | -                          | `void`                         | Restore session on app start |

### TokenService

**Location:** `@core/auth/services/token.service.ts`

**Methods:**

- `setTokens(access, refresh, id)` - Store tokens
- `getAccessToken()` - Get access token
- `getRefreshToken()` - Get refresh token
- `getIdToken()` - Get ID token
- `clearTokens()` - Remove all tokens
- `isTokenExpired(token)` - Check expiration

---

## Guards

**Location:** `@core/auth/guards/`

| Guard        | Description                                  |
| ------------ | -------------------------------------------- |
| `authGuard`  | Requires authentication, redirects to login  |
| `guestGuard` | Only unauthenticated, redirects to dashboard |
| `roleGuard`  | Requires specific role(s)                    |

---

## Interceptors

**Location:** `@core/auth/interceptors/`

| Interceptor        | Description                           |
| ------------------ | ------------------------------------- |
| `jwtInterceptor`   | Adds Authorization header to requests |
| `errorInterceptor` | Handles 401 errors, triggers refresh  |

---

## Models

**Location:** `@models/auth.model.ts`

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  roles: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

interface ConfirmRequest {
  username: string;
  confirmationCode: string;
}

interface ForgotPasswordRequest {
  username: string;
}

interface ResetPasswordRequest {
  username: string;
  confirmationCode: string;
  newPassword: string;
}
```

---

## Business Rules

1. **JWT tokens stored in localStorage**
   - accessToken: API authentication
   - refreshToken: Token renewal
   - idToken: User information

2. **Auto-refresh on 401**
   - Interceptor catches 401
   - Attempts token refresh
   - Retries original request

3. **User not confirmed flow**
   - Login returns UserNotConfirmedException
   - Redirects to confirm-account page
   - User can resend confirmation code

4. **Session initialization**
   - On app start, check stored tokens
   - If valid, restore user session
   - If expired, attempt refresh

---

## Routes

```typescript
// auth.routes.ts
export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'confirm-account', component: ConfirmAccountComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
];
```

**Route Guards:**

- Auth routes use `guestGuard` (redirect if logged in)
- Protected routes use `authGuard`

---

## Related Files

| Type         | Location                        |
| ------------ | ------------------------------- |
| Models       | `@models/auth.model.ts`         |
| Services     | `@core/auth/services/`          |
| Guards       | `@core/auth/guards/`            |
| Interceptors | `@core/auth/interceptors/`      |
| Layout       | `@layouts/auth-layout/`         |
| UI Input     | `@shared/components/ui/input/`  |
| UI Button    | `@shared/components/ui/button/` |

---

## Security Considerations

- Passwords never stored locally
- Tokens cleared on logout
- HTTPS required for API calls
- XSS prevention via Angular sanitization
