import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { SCHEMA_INIT_SQL } from "./init-sql";

type DrizzleDatabase = ReturnType<typeof drizzlePg<typeof schema>>;

let globalDb: DrizzleDatabase | null = null;
let isInitialized = false;

/**
 * Automatically encodes special characters (like '@' or '#') in the password segment
 * of a PostgreSQL connection URI if they were left unencoded in environment variables.
 */
function sanitizeConnectionString(connectionString: string): string {
  const protocolMatch = connectionString.match(/^([^:]+:\/\/)(.*)$/);
  if (!protocolMatch) return connectionString;

  const [, proto, rest] = protocolMatch;
  const lastAt = rest.lastIndexOf("@");
  if (lastAt === -1) return connectionString;

  const userPass = rest.slice(0, lastAt);
  const hostPortDb = rest.slice(lastAt + 1);

  const colonIdx = userPass.indexOf(":");
  if (colonIdx === -1) return connectionString;

  const user = userPass.slice(0, colonIdx);
  const rawPass = userPass.slice(colonIdx + 1);

  try {
    const decoded = decodeURIComponent(rawPass);
    const reEncoded = encodeURIComponent(decoded);
    return `${proto}${user}:${reEncoded}@${hostPortDb}`;
  } catch {
    return connectionString;
  }
}

export async function getDb(): Promise<DrizzleDatabase> {
  if (globalDb) {
    return globalDb;
  }

  const rawConnectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

  if (rawConnectionString) {
    const connectionString = sanitizeConnectionString(rawConnectionString);
    const client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, // Required for Supabase connection poolers (port 6543 / PgBouncer mode)
    });
    globalDb = drizzlePg(client, { schema });
    return globalDb;
  }

  // Fallback to in-process real PostgreSQL (PGlite) when DATABASE_URL is not provided
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");

  const pgliteInstance = new PGlite();
  if (!isInitialized) {
    await pgliteInstance.exec(SCHEMA_INIT_SQL);
    isInitialized = true;
  }

  const db = drizzlePglite(pgliteInstance, { schema }) as unknown as DrizzleDatabase;
  globalDb = db;
  return globalDb;
}

/**
 * Creates an isolated, fresh in-memory PostgreSQL instance for integration tests.
 */
export async function createTestDb(): Promise<DrizzleDatabase> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");

  const pgliteInstance = new PGlite();
  await pgliteInstance.exec(SCHEMA_INIT_SQL);

  return drizzlePglite(pgliteInstance, { schema }) as unknown as DrizzleDatabase;
}

export * from "./schema";
