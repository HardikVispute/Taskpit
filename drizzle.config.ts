import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// Load environment variables (.env, .env.local) matching the Next.js runtime
loadEnvConfig(process.cwd());

// Automatically encodes special characters (like leading '@') in password segment if unencoded
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

// For migrations, prefer direct connection (session mode, port 5432) over transaction pooler.
// If DIRECT_URL contains unreplaced placeholder [REGION], fall back to DATABASE_URL.
const rawDirect =
  process.env.DIRECT_URL && !process.env.DIRECT_URL.includes("[REGION]")
    ? process.env.DIRECT_URL
    : undefined;
const rawConnectionString = rawDirect || process.env.DATABASE_URL;
const connectionString = rawConnectionString ? sanitizeConnectionString(rawConnectionString) : "";

if (!connectionString && process.argv.includes("migrate")) {
  console.error(
    "\n[TaskPit Database Error] Missing database connection string for migrations.\n" +
    "Please define DIRECT_URL (direct connection, port 5432) or DATABASE_URL in .env.local.\n"
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});

