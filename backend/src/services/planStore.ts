import { getPool } from './db';

export interface Plan {
  id: string;
  name: string;
  dailyLimit: number;
  monthlyPrice: number;
  maxProspects: number;
}

interface PlanRow {
  id: string;
  name: string;
  daily_limit: number;
  monthly_price: number;
  max_prospects: number;
}

/**
 * Nombre total de recherches autorisées, à vie, pour un utilisateur sur le plan gratuit.
 * Contrairement au quota journalier des plans payants, cette limite ne se réinitialise jamais :
 * un compte gratuit n'a droit qu'à UNE seule recherche au total.
 */
export const FREE_PLAN_SEARCH_LIMIT = 1;

/** Erreur levée lorsqu'un utilisateur gratuit a déjà consommé sa recherche unique. */
export class FreePlanLimitError extends Error {
  constructor() {
    super(
      'Votre recherche gratuite a déjà été utilisée. Passez à un plan payant pour lancer de nouvelles recherches.',
    );
    this.name = 'FreePlanLimitError';
  }
}

const planCache = new Map<string, Plan>();

function rowToPlan(r: PlanRow): Plan {
  return {
    id: r.id,
    name: r.name,
    dailyLimit: r.daily_limit,
    monthlyPrice: r.monthly_price,
    maxProspects: r.max_prospects,
  };
}

export async function getPlan(planId: string): Promise<Plan> {
  if (planCache.has(planId)) return planCache.get(planId)!;

  const { rows } = await getPool().query<PlanRow>(
    'SELECT * FROM plans WHERE id = $1',
    [planId],
  );

  if (!rows.length) {
    return { id: 'free', name: 'Gratuit', dailyLimit: 1, monthlyPrice: 0, maxProspects: 100 };
  }

  const plan = rowToPlan(rows[0]);
  planCache.set(planId, plan);
  return plan;
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const { rows } = await getPool().query<{ plan: string }>(
    'SELECT plan FROM users WHERE id = $1',
    [userId],
  );
  const planId = rows.length ? rows[0].plan : 'free';
  return getPlan(planId);
}

export async function getUserSubscriptionStatus(userId: string): Promise<string | null> {
  const { rows } = await getPool().query<{ subscription_status: string | null }>(
    'SELECT subscription_status FROM users WHERE id = $1',
    [userId],
  );
  return rows[0]?.subscription_status ?? null;
}

export function isPaidPlan(plan: Plan): boolean {
  return plan.monthlyPrice > 0;
}

export function isFreePlan(plan: Plan): boolean {
  return !isPaidPlan(plan);
}

export async function setUserPlan(userId: string, planId: string): Promise<void> {
  await getPool().query(
    'UPDATE users SET plan = $1 WHERE id = $2',
    [planId, userId],
  );
}

export async function listPlans(): Promise<Plan[]> {
  const { rows } = await getPool().query<PlanRow>(
    'SELECT * FROM plans ORDER BY monthly_price ASC',
  );
  return rows.map(rowToPlan);
}
