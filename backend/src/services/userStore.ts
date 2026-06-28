import { getPool } from './db';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  createdAt: string;
}

// Utilisateurs déjà provisionnés (avec un vrai email) durant la vie du process :
// évite un aller-retour DB à chaque requête authentifiée.
const provisionedWithEmail = new Set<string>();

export async function ensureClerkUser(
  clerkId: string,
  email: string,
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  // Déjà provisionné avec un email réel : rien à faire.
  if (normalizedEmail && provisionedWithEmail.has(clerkId)) return;

  // `email` est UNIQUE NOT NULL : si Clerk ne nous a pas (encore) donné l'adresse,
  // on insère un placeholder unique pour garantir l'existence de la ligne (FK),
  // l'email réel étant mis à jour dès qu'il est connu.
  const emailToStore = normalizedEmail || `${clerkId}@clerk.local`;

  const { rows } = await getPool().query<{ id: string }>(
    'SELECT id FROM users WHERE id = $1',
    [clerkId],
  );
  const isNew = rows.length === 0;

  await getPool().query(
    `INSERT INTO users (id, email, password_hash, first_name, last_name)
     VALUES ($1, $2, '', '', '')
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
    [clerkId, emailToStore],
  );

  if (normalizedEmail) provisionedWithEmail.add(clerkId);

  if (isNew && normalizedEmail) {
    try {
      const { sendWelcomeEmail } = await import('./emailService');
      const name = normalizedEmail.split('@')[0].split(/[._-]/)[0];
      sendWelcomeEmail(normalizedEmail, name.charAt(0).toUpperCase() + name.slice(1)).catch(() => {});
    } catch { /* email service optional */ }
  }
}

interface UserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  created_at: string;
}

function rowToUser(r: UserRow): User {
  return {
    id: r.id,
    email: r.email,
    firstName: r.first_name,
    lastName: r.last_name,
    passwordHash: r.password_hash,
    createdAt: r.created_at,
  };
}

export async function findByEmail(email: string): Promise<User | undefined> {
  const { rows } = await getPool().query<UserRow>(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()],
  );
  return rows.length ? rowToUser(rows[0]) : undefined;
}


export async function deleteUser(userId: string): Promise<boolean> {
  const { rowCount } = await getPool().query('DELETE FROM users WHERE id = $1', [userId]);
  return (rowCount ?? 0) > 0;
}

export async function purgeInactiveUsers(maxInactiveDays: number = 365): Promise<number> {
  const { rowCount } = await getPool().query(
    `DELETE FROM users WHERE created_at < NOW() - INTERVAL '1 day' * $1
     AND id NOT IN (SELECT DISTINCT user_id FROM prospects)
     AND id NOT IN (SELECT DISTINCT user_id FROM user_usage WHERE date > CURRENT_DATE - INTERVAL '1 day' * $1)`,
    [maxInactiveDays],
  );
  return rowCount ?? 0;
}
