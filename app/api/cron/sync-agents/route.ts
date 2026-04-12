export const maxDuration = 300; // 5 min — full sync of ~38k agents takes ~40s

/**
 * Spark → Supabase agent sync
 *
 * Paginates through the ARMLS member roster via Spark /v1/accounts
 * and upserts every active member into the `agents` table.
 *
 * Runs daily at 6 AM UTC via Vercel Cron. Can also be triggered manually.
 * After upserting agents, enriches active_listing_count from the listings table.
 *
 * Protected by CRON_SECRET env var.
 */

import { NextResponse } from "next/server";
import { fetchSparkAccounts, type SparkAccount } from "@/lib/spark";
import {
  upsertAgentsBatch,
  updateAgentListingCounts,
  pruneStaleAgents,
  type AgentUpsertData,
} from "@/lib/db/listings-index";

const CRON_SECRET = process.env.CRON_SECRET;

function slugify(name: string, sparkMemberId: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+$/, "")
    .replace(/^-+/, "");
  // Append a portion of the spark member ID to guarantee uniqueness.
  // IDs look like "20240502213401501889000000" — trailing zeros are common,
  // so use chars 8-14 (the time-based portion) for better entropy.
  const suffix = sparkMemberId.slice(8, 14);
  return `${base}-${suffix}`;
}

function primaryPhone(phones: SparkAccount["Phones"]): string | null {
  if (!phones || phones.length === 0) return null;
  const primary = phones.find((p) => p.Primary) ?? phones[0];
  return primary?.Number ?? null;
}

function primaryEmail(emails: SparkAccount["Emails"]): string | null {
  if (!emails || emails.length === 0) return null;
  const primary = emails.find((e) => e.Primary) ?? emails[0];
  return primary?.Address ?? null;
}

function toAgentData(account: SparkAccount): AgentUpsertData {
  return {
    spark_member_id: account.Id,
    slug: slugify(account.Name, account.Id),
    name: account.Name,
    first_name: account.FirstName ?? null,
    last_name: account.LastName ?? null,
    office_name: account.Office ?? null,
    office_id: account.OfficeId ?? null,
    primary_city: account.Associations?.[0] ?? null,
    license_number: account.LicenseNumber ?? null,
    phone: primaryPhone(account.Phones),
    email: primaryEmail(account.Emails),
    associations: account.Associations ?? [],
    is_givenest: (account.Office ?? "").toLowerCase() === "givenest",
    idx_participant: account.IdxParticipant ?? true,
    modified_at: account.ModificationTimestamp ?? null,
  };
}

export async function GET(request: Request) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const start = Date.now();
  let totalFetched = 0;
  let totalUpserted = 0;

  try {
    const filter = "UserType Eq 'Member'";
    let page = 1;

    while (true) {
      const accounts = await fetchSparkAccounts(filter, page);
      if (accounts.length === 0) break;

      totalFetched += accounts.length;
      const rows = accounts.map(toAgentData);
      await upsertAgentsBatch(rows);
      totalUpserted += rows.length;

      if (accounts.length < 1000) break;
      page++;
    }

    // Enrich listing counts from the listings table
    await updateAgentListingCounts();

    // Prune agents not seen in 7 days
    const pruned = await pruneStaleAgents();

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(
      `Agent sync: fetched=${totalFetched} upserted=${totalUpserted} pruned=${pruned} in ${elapsed}s`,
    );

    return NextResponse.json({
      fetched: totalFetched,
      upserted: totalUpserted,
      pruned,
      elapsedSeconds: parseFloat(elapsed),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Agent sync error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
