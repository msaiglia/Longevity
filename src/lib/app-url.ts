/**
 * Restituisce l'URL pubblico dell'app, sempre valido.
 * Ordine di preferenza:
 * 1. NEXT_PUBLIC_APP_URL, se impostata esplicitamente (es. per un dominio personalizzato)
 * 2. Il dominio di produzione assegnato automaticamente da Vercel
 * 3. Il dominio del deployment corrente assegnato da Vercel
 * 4. Fallback locale, solo per lo sviluppo in locale
 */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
