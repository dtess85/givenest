import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Drop-in replacement for @vercel/postgres `sql` — returns { rows, fields }
export async function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  const text = strings.reduce(
    (acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ""),
    ""
  );
  return pool.query(text, values as unknown[]);
}
