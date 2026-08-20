// Crea (o aggiorna) l'account amministratore iniziale.
// Uso: node scripts/seed-admin.mjs "Nome" "Cognome" "email@esempio.it" "PasswordSicura123"
import { neon } from "@neondatabase/serverless";
import { hash } from "bcryptjs";
import { config } from "dotenv";

config({ path: ".env.local" });

const [firstName, lastName, email, password] = process.argv.slice(2);

if (!firstName || !lastName || !email || !password) {
  console.error(
    'Uso: node scripts/seed-admin.mjs "Nome" "Cognome" "email@esempio.it" "PasswordSicura123"',
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("La password deve avere almeno 8 caratteri.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const passwordHash = await hash(password, 12);

const [row] = await sql`
  insert into users (first_name, last_name, email, phone, password_hash, role, status)
  values (${firstName}, ${lastName}, ${email.toLowerCase()}, '', ${passwordHash}, 'admin', 'approved')
  on conflict (email) do update set
    password_hash = excluded.password_hash,
    role = 'admin',
    status = 'approved',
    first_name = excluded.first_name,
    last_name = excluded.last_name
  returning id, email
`;

console.log(`Account amministratore pronto: ${row.email} (id ${row.id})`);
