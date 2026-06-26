import { vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { TEST_SECRET } from './auth';

// Since M8.3, requireAuth verifies Clerk session tokens only. The test suite
// signs its own JWTs (helpers/auth.ts), so we mock @clerk/backend to verify
// those tokens with the local test secret. This keeps the production middleware
// Clerk-only while letting tests drive authenticated routes.
process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || 'test-clerk-secret';
// Some test files sign their JWTs from process.env.JWT_SECRET at import time
// without calling setupAuthEnv(); pin it so every token verifies against the
// same secret the mock below uses.
process.env.JWT_SECRET = TEST_SECRET;

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn(async (token: string) => jwt.verify(token, TEST_SECRET)),
  createClerkClient: () => ({
    users: {
      getUser: async () => ({ emailAddresses: [] }),
    },
  }),
}));
