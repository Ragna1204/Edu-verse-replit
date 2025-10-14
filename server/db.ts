import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import { join } from 'path';
import { mkdirSync } from 'fs';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Extract database path from DATABASE_URL
let dbPath: string;
if (process.env.DATABASE_URL.startsWith('file:')) {
  // Handle file: protocol for SQLite (e.g., "file:dev.sqlite")
  dbPath = process.env.DATABASE_URL.replace('file:', '');
} else if (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.includes('neon.tech')) {
  throw new Error("PostgreSQL/Neon databases are not supported in development. Please use SQLite with 'DATABASE_URL=file:dev.sqlite'");
} else {
  // Assume direct path
  dbPath = process.env.DATABASE_URL;
}

// Create the directory if it doesn't exist
const dir = join(process.cwd());
mkdirSync(dir, { recursive: true });

const sqlite = new Database(join(dir, dbPath));
export const db = drizzle({ client: sqlite, schema });
