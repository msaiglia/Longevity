# Longevity — Prenotazioni corso

Webapp di prenotazione per il corso tenuto dal Dott. Carlo Poggioli: registrazione atleti con
approvazione staff, calendario sessioni con capienza e lista d'attesa, sistema di comunicazioni
interne con conferma di lettura, pannello amministrativo completo.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- [Drizzle ORM](https://orm.drizzle.team) + [Neon Postgres](https://neon.tech)
- [Auth.js v5](https://authjs.dev) (credenziali email/password)
- [Resend](https://resend.com) per le email transazionali
- Tailwind CSS v4

## Sviluppo locale

```bash
npm install
cp .env.example .env.local   # poi compila i valori
npx drizzle-kit generate     # se modifichi src/db/schema.ts
node scripts/migrate.mjs     # applica le migrazioni al database
node scripts/seed-admin.mjs "Nome" "Cognome" "email@esempio.it" "PasswordSicura123"
npm run dev
```

## Struttura

- `src/db/schema.ts` — schema del database (Drizzle)
- `src/actions/` — server actions (prenotazioni, lista d'attesa, messaggi, admin)
- `src/app/(athlete)/` — area atleta: prenota, le mie prenotazioni, comunicazioni, profilo
- `src/app/admin/` — pannello staff: panoramica, iscrizioni, sessioni, comunicazioni
- `src/lib/emails.ts` — template email (Resend)

## Variabili d'ambiente

Vedi `.env.example`. Su Vercel vanno impostate nelle Project Settings → Environment Variables.

## Deploy

Il progetto è pensato per Vercel: collegare il repository e impostare le variabili d'ambiente.
Il database Neon è già provisioned e raggiungibile da qualsiasi region Vercel tramite il driver
serverless HTTP (`@neondatabase/serverless`).
