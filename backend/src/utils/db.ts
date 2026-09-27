// db.ts - Creates a single shared Prisma client for the whole app.
// In Prisma 7 + PostgreSQL, we use the pg adapter.

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Create a connection pool using the DATABASE_URL from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Attach the pg adapter to Prisma
const adapter = new PrismaPg(pool);

// Export one shared prisma instance (singleton pattern)
const prisma = new PrismaClient({ adapter });

export default prisma;
