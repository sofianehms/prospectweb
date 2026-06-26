import jwt from 'jsonwebtoken';

export const TEST_SECRET = 'test-jwt-secret';
export const TEST_USER = { sub: 'test-user-id', email: 'test@example.com' };

export function testToken(): string {
  return jwt.sign(TEST_USER, TEST_SECRET, { expiresIn: '1h' });
}

export function adminToken(): string {
  return jwt.sign({ ...TEST_USER, role: 'admin' }, TEST_SECRET, { expiresIn: '1h' });
}

export function setupAuthEnv(): void {
  process.env.JWT_SECRET = TEST_SECRET;
  // requireAuth only attempts verification when a Clerk secret is present;
  // the @clerk/backend mock (helpers/setup.ts) verifies our test JWTs.
  process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || 'test-clerk-secret';
}
