import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL ?? "postgresql://crm_user:crm_pass@localhost:5432/crm_highlevel";

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
