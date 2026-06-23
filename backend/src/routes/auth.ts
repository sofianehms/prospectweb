import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { findByEmail, createUser, verifyPassword } from '../services/userStore';
import { authRateLimiter } from '../middleware/rateLimit';

const router = Router();
router.use(authRateLimiter);

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET non configuré');
  return secret;
}

router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'E-mail invalide.' });
    return;
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    return;
  }

  try {
    const user = await createUser(email, password);
    const token = jwt.sign({ sub: user.id, email: user.email }, jwtSecret(), { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, email: user.email } });
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

  const user = findByEmail(email);
  if (!user || !(await verifyPassword(user, password))) {
    res.status(401).json({ error: 'Identifiants incorrects.' });
    return;
  }

  const token = jwt.sign({ sub: user.id, email: user.email }, jwtSecret(), { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email } });
});

router.get('/me', (req: Request, res: Response) => {
  const header = req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Non authentifié.' });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), jwtSecret()) as { sub: string; email: string };
    res.json({ id: payload.sub, email: payload.email });
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
});

export default router;
