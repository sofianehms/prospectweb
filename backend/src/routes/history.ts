import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireInternalSecret } from '../middleware/auth';
import { listSearchHistory, deleteSearchRecords, getSearchById } from '../services/searchHistory';

const router = Router();
router.use(requireInternalSecret);
router.use(requireAuth);

router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const record = await getSearchById(req.user!.sub, req.params.id);
  if (!record) {
    res.status(404).json({ error: 'Recherche introuvable.' });
    return;
  }
  res.json(record);
});

router.get('/', async (req: Request, res: Response) => {
  const history = await listSearchHistory(req.user!.sub);
  res.json(history);
});

router.delete('/', async (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id: unknown) => typeof id === 'string')) {
    res.status(400).json({ error: 'ids doit être un tableau de chaînes non vide.' });
    return;
  }
  const deleted = await deleteSearchRecords(req.user!.sub, ids);
  res.json({ deleted });
});

export default router;
