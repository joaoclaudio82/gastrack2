import type { Page } from '@playwright/test';

export type MockAuthOptions = Readonly<{
  user?: Readonly<{
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    companyId?: string;
    companyName?: string;
    roles?: readonly string[];
  }>;
}>;

function base64EncodeJson(value: unknown): string {
  const json = JSON.stringify(value);
  return Buffer.from(json, 'utf-8').toString('base64');
}

function createJwt(payload: Record<string, unknown>): string {
  const header = { alg: 'none', typ: 'JWT' } as const;
  const encodedHeader = base64EncodeJson(header);
  const encodedPayload = base64EncodeJson(payload);
  return `${encodedHeader}.${encodedPayload}.signature`;
}

export async function mockAuth(page: Page, options: MockAuthOptions = {}): Promise<void> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expSeconds = nowSeconds + 60 * 60; // 1h

  const user = options.user ?? {};
  const userId = user.id ?? 'e2e-user-id';
  const email = user.email ?? 'e2e.user@gastrack.local';
  const firstName = user.firstName ?? 'E2E';
  const lastName = user.lastName ?? 'User';
  const roles = user.roles ?? ['USER'];
  const companyId = user.companyId ?? 'e2e-company-id';
  const companyName = user.companyName ?? 'GasTrack E2E';

  const accessToken = createJwt({
    exp: expSeconds,
    iat: nowSeconds,
    sub: userId,
    roles,
  });

  const idToken = createJwt({
    exp: expSeconds,
    iat: nowSeconds,
    sub: userId,
    email,
    given_name: firstName,
    family_name: lastName,
    name: `${firstName} ${lastName}`,
    'cognito:groups': roles,
    'custom:company_id': companyId,
    'custom:company_name': companyName,
    auth_time: nowSeconds,
  });

  const refreshToken = createJwt({
    exp: expSeconds + 7 * 24 * 60 * 60,
    iat: nowSeconds,
    sub: userId,
  });

  await page.addInitScript(
    ({ accessTokenValue, refreshTokenValue, idTokenValue }) => {
      localStorage.setItem('access_token', accessTokenValue);
      localStorage.setItem('refresh_token', refreshTokenValue);
      localStorage.setItem('id_token', idTokenValue);
    },
    { accessTokenValue: accessToken, refreshTokenValue: refreshToken, idTokenValue: idToken },
  );
}
