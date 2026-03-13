import { neon } from '@neondatabase/serverless';
import { FREE_TIER_LIMIT } from './constants';

type RateLimitRow = { count: number };

let sql: ReturnType<typeof neon> | null = null;

function getDb() {
  if (!sql && process.env.DATABASE_URL) {
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

export async function initRateLimitTable() {
  const db = getDb();
  if (!db) return;
  await db`
    CREATE TABLE IF NOT EXISTS rate_limits (
      ip TEXT PRIMARY KEY,
      count INTEGER DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function checkRateLimit(ip: string): Promise<{ allowed: boolean; used: number }> {
  const db = getDb();
  if (!db) return { allowed: true, used: 0 };
  await initRateLimitTable();
  const rows = (await db`SELECT count FROM rate_limits WHERE ip = ${ip}`) as RateLimitRow[];
  const used = rows[0]?.count ?? 0;
  return { allowed: used < FREE_TIER_LIMIT, used };
}

export async function incrementRateLimit(ip: string): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const rows = (await db`
    INSERT INTO rate_limits (ip, count, updated_at)
    VALUES (${ip}, 1, NOW())
    ON CONFLICT (ip) DO UPDATE
    SET count = rate_limits.count + 1, updated_at = NOW()
    RETURNING count
  `) as RateLimitRow[];
  return rows[0]?.count ?? 1;
}

export async function getUsage(ip: string): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  await initRateLimitTable();
  const rows = (await db`SELECT count FROM rate_limits WHERE ip = ${ip}`) as RateLimitRow[];
  return rows[0]?.count ?? 0;
}
