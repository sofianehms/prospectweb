import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireInternalSecret } from '../middleware/auth';
import {
  listProspects,
  addProspect,
  removeProspect,
  updateCrmStatus,
  updateNotes,
  updateFollowUp,
  CrmStatus,
} from '../services/prospectStore';

const VALID_STATUSES: CrmStatus[] = ['to_contact', 'contacted', 'discussing', 'won', 'lost'];

const router = Router();
router.use(requireInternalSecret);
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  const prospects = await listProspects(req.user!.sub);
  res.json(prospects);
});

router.post('/', async (req: Request, res: Response) => {
  const { id, name, address, type, phone, mapsUrl, rating, ratingCount, websiteStatus } = req.body ?? {};

  if (!id || !name || !address || !type || !mapsUrl) {
    res.status(400).json({ error: 'Champs requis : id, name, address, type, mapsUrl.' });
    return;
  }

  const prospect = await addProspect(req.user!.sub, {
    id, name, address, type,
    phone: phone ?? null,
    mapsUrl,
    rating: rating ?? null,
    ratingCount: ratingCount ?? null,
    websiteStatus: websiteStatus ?? 'none',
  });
  res.status(201).json(prospect);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const deleted = await removeProspect(req.user!.sub, req.params.id as string);
  if (!deleted) {
    res.status(404).json({ error: 'Prospect non trouvé.' });
    return;
  }
  res.status(204).end();
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  const { status } = req.body ?? {};
  if (!status || !VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: `Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(', ')}.` });
    return;
  }
  const prospect = await updateCrmStatus(req.user!.sub, req.params.id as string, status);
  if (!prospect) {
    res.status(404).json({ error: 'Prospect non trouvé.' });
    return;
  }
  res.json(prospect);
});

router.patch('/:id/notes', async (req: Request, res: Response) => {
  const { notes } = req.body ?? {};
  if (typeof notes !== 'string') {
    res.status(400).json({ error: 'Le champ notes est requis (string).' });
    return;
  }
  const prospect = await updateNotes(req.user!.sub, req.params.id as string, notes);
  if (!prospect) {
    res.status(404).json({ error: 'Prospect non trouvé.' });
    return;
  }
  res.json(prospect);
});

router.patch('/:id/follow-up', async (req: Request, res: Response) => {
  const { followUpAt } = req.body ?? {};
  if (followUpAt !== null && typeof followUpAt !== 'string') {
    res.status(400).json({ error: 'followUpAt doit être une date ISO ou null.' });
    return;
  }
  const prospect = await updateFollowUp(req.user!.sub, req.params.id as string, followUpAt);
  if (!prospect) {
    res.status(404).json({ error: 'Prospect non trouvé.' });
    return;
  }
  res.json(prospect);
});

export default router;
