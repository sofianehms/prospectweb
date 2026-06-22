import { Request, Response, NextFunction } from 'express';

export function requireInternalSecret(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.BACKEND_SECRET;

  if (!expected) {
    console.error('BACKEND_SECRET non configuré : toutes les requêtes sont rejetées.');
    res.status(503).json({ error: 'Service mal configuré.' });
    return;
  }

  const provided = req.header('x-internal-secret');
  if (provided !== expected) {
    res.status(401).json({ error: 'Non autorisé.' });
    return;
  }

  next();
}
