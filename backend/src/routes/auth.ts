import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { findByEmail, createUser, verifyPassword, deleteUser } from '../services/userStore';
import { authRateLimiter } from '../middleware/rateLimit';

const router = Router();
router.use(authRateLimiter);

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET non configuré');
  return secret;
}

function userPayload(user: { id: string; email: string; firstName: string; lastName: string }) {
  return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName };
}

router.post('/register', async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body ?? {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'E-mail invalide.' });
    return;
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    return;
  }
  if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
    res.status(400).json({ error: 'Le prénom est requis.' });
    return;
  }
  if (!lastName || typeof lastName !== 'string' || !lastName.trim()) {
    res.status(400).json({ error: 'Le nom est requis.' });
    return;
  }

  try {
    const user = await createUser(email, password, firstName, lastName);
    const token = jwt.sign({ sub: user.id, email: user.email }, jwtSecret(), { expiresIn: '7d' });
    res.status(201).json({ token, user: userPayload(user) });
  } catch (err) {
    res.status(409).json({ error: (err as Error).message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: 'E-mail et mot de passe requis.' });
    return;
  }

  const user = await findByEmail(email);
  if (!user || !(await verifyPassword(user, password))) {
    res.status(401).json({ error: 'Identifiants incorrects.' });
    return;
  }

  const token = jwt.sign({ sub: user.id, email: user.email }, jwtSecret(), { expiresIn: '7d' });
  res.json({ token, user: userPayload(user) });
});

router.get('/me', async (req: Request, res: Response) => {
  const header = req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Non authentifié.' });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), jwtSecret()) as { sub: string; email: string };
    const user = await findByEmail(payload.email);
    if (!user) {
      res.status(401).json({ error: 'Utilisateur introuvable.' });
      return;
    }
    res.json(userPayload(user));
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
});

router.delete('/me', async (req: Request, res: Response) => {
  const header = req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Non authentifié.' });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), jwtSecret()) as { sub: string; email: string };
    const deleted = await deleteUser(payload.sub);
    if (!deleted) {
      res.status(404).json({ error: 'Compte introuvable.' });
      return;
    }
    res.status(204).end();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
});

export default router;
