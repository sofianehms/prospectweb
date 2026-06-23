import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

const STORE_PATH = resolve(__dirname, '../../data/users.json');

function load(): User[] {
  if (!existsSync(STORE_PATH)) return [];
  return JSON.parse(readFileSync(STORE_PATH, 'utf-8'));
}

function save(users: User[]): void {
  const dir = resolve(STORE_PATH, '..');
  if (!existsSync(dir)) {
    const { mkdirSync } = require('fs');
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(STORE_PATH, JSON.stringify(users, null, 2));
}

export function findByEmail(email: string): User | undefined {
  return load().find(u => u.email === email.toLowerCase());
}

export async function createUser(email: string, password: string): Promise<User> {
  const users = load();
  if (users.find(u => u.email === email.toLowerCase())) {
    throw new Error('Un compte existe déjà avec cet e-mail.');
  }
  const user: User = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  save(users);
  return user;
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}
