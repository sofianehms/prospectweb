import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireInternalSecret } from '../middleware/auth';
import { listSearchHistory } from '../services/searchHistory';

const router = Router();
router.use(requireInternalSecret);
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  const history = await listSearchHistory(req.user!.sub);
  res.json(history);
});

export default router;
