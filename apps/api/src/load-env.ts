/**
 * Lädt apps/api/.env explizit — ohne das kann RESEND_API_KEY fehlen,
 * während DATABASE_URL ggf. schon aus der Shell / anderem Mechanismus gesetzt ist.
 */
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';

/** Zuerst .env neben dem Build (dist/) — vermeidet Root-.env ohne RESEND bei turbo cwd = Repo-Root. */
const candidates = [
  resolve(dirname(__dirname), '.env'),
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'apps', 'api', '.env'),
];

for (const path of candidates) {
  if (existsSync(path)) {
    const { error } = config({ path });
    if (!error && process.env.NODE_ENV !== 'production') {
      console.log('[api] .env geladen:', path);
    }
    break;
  }
}
