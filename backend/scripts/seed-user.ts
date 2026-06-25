/// <reference types="node" />
import { createUser } from '../src/services/userStore';

const email = process.argv[2];
const password = process.argv[3];
const firstName = process.argv[4] || 'Admin';
const lastName = process.argv[5] || 'Nosite';

if (!email || !password) {
  console.error('Usage: npx ts-node scripts/seed-user.ts <email> <password> [firstName] [lastName]');
  process.exit(1);
}

createUser(email, password, firstName, lastName)
  .then(user => console.log(`Utilisateur créé : ${user.email} (id: ${user.id})`))
  .catch(err => { console.error(err.message); process.exit(1); });
