import { Request, Response, NextFunction } from 'express';
import { verifyToken, createClerkClient, ClerkClient } from '@clerk/backend';
import { ensureClerkUser } from '../services/userStore';

export interface AuthPayload {
  sub: string;
  email: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

let _clerkClient: ClerkClient | null = null;

function getClerkClient(): ClerkClient {
  if (!_clerkClient) {
    _clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY ?? '' });
  }
  return _clerkClient;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentification requise.' });
    return;
  }

  const token = header.slice(7);

  if (process.env.CLERK_SECRET_KEY) {
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      let email = (payload as Record<string, unknown>).email as string | undefined;

      // Clerk session tokens don't include the email by default; fetch it.
      if (!email) {
        try {
          const user = await getClerkClient().users.getUser(payload.sub);
          email = user.emailAddresses?.[0]?.emailAddress ?? '';
        } catch {
          email = '';
        }
      }

      req.user = {
        sub: payload.sub,
        email: email ?? '',
        role: (payload as Record<string, unknown>).role as string | undefined,
      };

      if (email) {
        ensureClerkUser(payload.sub, email).catch(() => {});
      }

      next();
      return;
    } catch {
      // Clerk verification failed
    }
  }

  res.status(401).json({ error: 'Token invalide ou expiré.' });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
    return;
  }
  next();
}
