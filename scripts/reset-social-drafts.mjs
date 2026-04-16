// One-shot: delete all draft/rendering social_posts rows, then re-run the
// drafter for mon/wed/fri against the local dev server. Run with:
//   bash -c 'set -a; source .env.local; set +a; node scripts/reset-social-drafts.mjs'
// (that pattern forces .env.local to override any empty shell env vars;
// see npm scripts in package.json for precedent.)
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const CRON_SECRET = process.env.CRON_SECRET ?? null;
const BASE = process.env.DRAFT_BASE_URL ?? "http://localhost:3000";

async function main() {
  const { rowCount } = await pool.query(
    `DELETE FROM social_posts WHERE status IN ('draft','rendering')`
  );
  console.log(`deleted ${rowCount} draft/rendering rows`);
  await pool.end();

  for (const day of ["mon", "wed", "fri"]) {
    const url = `${BASE}/api/cron/social-draft-listing?day=${day}`;
    const headers = CRON_SECRET
      ? { Authorization: `Bearer ${CRON_SECRET}` }
      : {};
    const res = await fetch(url, { method: "POST", headers });
    const body = await res.json().catch(() => null);
    console.log(`\n[${day}] ${res.status}`);
    console.log(JSON.stringify(body, null, 2));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
