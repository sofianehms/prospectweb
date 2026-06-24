import { Router, Request, Response } from 'express';
import { searchNominatim } from '../services/nominatim';
import { requireInternalSecret } from '../middleware/auth';

const router = Router();
router.use(requireInternalSecret);

router.get('/', async (req: Request, res: Response) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  if (!q || q.length < 2) {
    res.json([]);
    return;
  }

  try {
    const results = await searchNominatim(q);
    res.json(results);
  } catch {
    res.status(502).json({ error: 'Service d\'autocomplétion indisponible.' });
  }
});

export default router;
