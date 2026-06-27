import { Request, Response, NextFunction } from 'express';
import { getPool } from '../services/db';

export type ApiScope = 'prospects:read' | 'prospects:write' | 'search';

export interface ApiKeyRecord {
  userId: string;
  scopes: ApiScope[];
}

async function lookupApiKey(key: string): Promise<ApiKeyRecord | null> {
  const pool = getPool();
  if (!pool) return null;

  const { rows } = await pool.query(
    `SELECT user_id, scopes FROM api_keys WHERE key = $1 AND revoked = false`,
    [key],
  );

  if (rows.length === 0) return null;
  return { userId: rows[0].user_id, scopes: rows[0].scopes };
}

export function requireApiKey(...requiredScopes: ApiScope[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers['x-api-key'] as string | undefined;
    if (!key) {
      res.status(401).json({ error: 'Header x-api-key requis.' });
      return;
    }

    try {
      const record = await lookupApiKey(key);
      if (!record) {
        res.status(401).json({ error: 'Clé API invalide ou révoquée.' });
        return;
      }

      for (const scope of requiredScopes) {
        if (!record.scopes.includes(scope)) {
          res.status(403).json({ error: `Scope manquant : ${scope}.` });
          return;
        }
      }

      req.user = { sub: record.userId, email: '' };
      next();
    } catch {
      res.status(500).json({ error: 'Erreur de validation de la clé API.' });
    }
  };
}
