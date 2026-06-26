import { Router } from 'express';
import { authRateLimiter } from '../middleware/rateLimit';

const router = Router();
router.use(authRateLimiter);

export default router;
