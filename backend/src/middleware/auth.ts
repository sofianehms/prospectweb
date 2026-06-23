import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';

export function requireInternalSecret(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.BACKEND_SECRET;

  if (!expected) {
    console.error('BACKEND_SECRET non configuré : toutes les requêtes sont rejetées.');
    res.status(503).json({ error: 'Service mal configuré.' });
    return;
  }

  const provided = req.header('x-internal-secret') ?? '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.status(401).json({ error: 'Non autorisé.' });
    return;
  }

  next();
}
