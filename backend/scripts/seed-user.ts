/// <reference types="node" />
import { createUser } from '../src/services/userStore';

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: npx ts-node scripts/seed-user.ts <email> <password>');
  process.exit(1);
}

createUser(email, password)
  .then(user => console.log(`Utilisateur créé : ${user.email} (id: ${user.id})`))
  .catch(err => { console.error(err.message); process.exit(1); });
