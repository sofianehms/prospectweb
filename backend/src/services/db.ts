import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL non configuré');
    pool = new Pool({ connectionString: url, max: 10 });
  }
  return pool;
}

export async function initDb(): Promise<void> {
  const db = getPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS prospects (
      id              TEXT NOT NULL,
      user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name            TEXT NOT NULL,
      address         TEXT NOT NULL,
      type            TEXT NOT NULL,
      phone           TEXT,
      maps_url        TEXT NOT NULL,
      rating          REAL,
      rating_count    INTEGER,
      website_status  TEXT NOT NULL DEFAULT 'none',
      crm_status      TEXT NOT NULL DEFAULT 'to_contact',
      notes           TEXT NOT NULL DEFAULT '',
      added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      cached_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (id, user_id)
    )
  `);

  await db.query(`
    ALTER TABLE prospects ADD COLUMN IF NOT EXISTS cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_prospects_user ON prospects(user_id)
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_usage (
      user_id   TEXT NOT NULL,
      date      DATE NOT NULL DEFAULT CURRENT_DATE,
      calls     INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, date)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS google_usage (
      date      DATE PRIMARY KEY DEFAULT CURRENT_DATE,
      places    INTEGER NOT NULL DEFAULT 0,
      geocoding INTEGER NOT NULL DEFAULT 0
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS search_history (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      address     TEXT NOT NULL,
      lat         REAL NOT NULL,
      lng         REAL NOT NULL,
      radius      INTEGER NOT NULL,
      types       TEXT NOT NULL DEFAULT '',
      result_count INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id)
  `);

  await db.query(`
    ALTER TABLE prospects ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS plans (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      daily_limit     INTEGER NOT NULL,
      monthly_price   INTEGER NOT NULL DEFAULT 0,
      max_prospects   INTEGER NOT NULL DEFAULT 100
    )
  `);

  await db.query(`
    INSERT INTO plans (id, name, daily_limit, monthly_price, max_prospects) VALUES
      ('free',     'Gratuit',    50,   0,  100),
      ('pro',      'Pro',       300,  29,  1000),
      ('business', 'Business', 1000,  79, 10000)
    ON CONFLICT (id) DO NOTHING
  `);

  await db.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
  `);

  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT ''`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT NOT NULL DEFAULT ''`);

  await db.query(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`);
  await db.query(`ALTER TABLE users ALTER COLUMN password_hash SET DEFAULT ''`);

  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'none'`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS stripe_events (
      event_id    TEXT PRIMARY KEY,
      event_type  TEXT NOT NULL,
      processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS stripe_payment_log (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id     TEXT,
      event_type  TEXT NOT NULL,
      invoice_id  TEXT,
      amount      INTEGER,
      currency    TEXT,
      status      TEXT NOT NULL,
      failure_message TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}
