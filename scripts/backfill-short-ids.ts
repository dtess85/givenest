import { pool } from "../lib/db";
import { assignMissingShortIds } from "../lib/db/listings-index";

async function main() {
  const start = Date.now();
  let total = 0;
  while (true) {
    const n = await assignMissingShortIds(1000);
    if (n === 0) break;
    total += n;
    process.stdout.write(`\rAssigned: ${total}`);
  }
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total, COUNT(short_id)::int AS with_short FROM listings`
  );
  console.log(`\nDone in ${((Date.now() - start) / 1000).toFixed(1)}s. Coverage:`, rows[0]);
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
