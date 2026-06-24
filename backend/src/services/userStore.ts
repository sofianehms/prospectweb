import bcrypt from 'bcryptjs';
import { getPool } from './db';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

function rowToUser(r: UserRow): User {
  return { id: r.id, email: r.email, passwordHash: r.password_hash, createdAt: r.created_at };
}

export async function findByEmail(email: string): Promise<User | undefined> {
  const { rows } = await getPool().query<UserRow>(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()],
  );
  return rows.length ? rowToUser(rows[0]) : undefined;
}

export async function createUser(email: string, password: string): Promise<User> {
  const existing = await findByEmail(email);
  if (existing) throw new Error('Un compte existe déjà avec cet e-mail.');

  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);

  const { rows } = await getPool().query<UserRow>(
    'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
    [id, email.toLowerCase(), passwordHash],
  );
  return rowToUser(rows[0]);
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}
