import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
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

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentification requise.' });
    return;
  }

  const token = header.slice(7);

  // Try Clerk session token verification
  if (process.env.CLERK_SECRET_KEY) {
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      const email = (payload as Record<string, unknown>).email as string ?? '';
      req.user = {
        sub: payload.sub,
        email,
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
