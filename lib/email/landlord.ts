/**
 * Resend-backed email notifications for the landlord property-management
 * dashboard. Centralized here so:
 *   - All landlord touchpoints share the same `from` and visual style
 *   - We respect `comm_prefs.email` / `comm_prefs.invoice_emails` in one place
 *   - Send failures don't crash the calling cron / route handler
 *
 * `from` address: prefers `LANDLORD_EMAIL_FROM` env (e.g.
 * "Givenest <hello@givenest.com>") so we can swap to a verified domain
 * without redeploying. Falls back to Resend's onboarding sender so dev
 * still works without DNS verification.
 *
 * Every helper here resolves to `void` and never throws — Stripe webhooks
 * and crons should not fail just because Resend hiccuped.
 */

import { Resend } from "resend";
import type { Landlord, LandlordInvoice, LandlordDocument, PropertyMgmt } from "@/lib/db/landlords";

const FROM = process.env.LANDLORD_EMAIL_FROM ?? "Givenest <onboarding@resend.dev>";
const ADMIN_NOTIFY_TO =
  process.env.LANDLORD_ADMIN_NOTIFY ?? "dustin@givenest.com,kyndall@givenest.com";

let cached: Resend | null = null;
function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (cached) return cached;
  cached = new Resend(key);
  return cached;
}

const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});
function fmtCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return usd2.format(cents / 100);
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  /** Bypass `comm_prefs.email` — used for transactional events the user
   *  shouldn't be able to mute (e.g. payment failures). */
  override?: boolean;
}

async function send({ to, subject, html }: SendArgs): Promise<void> {
  const resend = client();
  if (!resend) {
    console.warn("[email/landlord] RESEND_API_KEY missing; skipping send to", to);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("[email/landlord] send failed:", err);
  }
}

function shouldEmail(landlord: Landlord, kind: "general" | "invoice" | "transactional"): boolean {
  // Transactional events (payment failed, invite link) bypass prefs.
  if (kind === "transactional") return true;
  if (kind === "invoice") return landlord.comm_prefs.invoice_emails;
  return landlord.comm_prefs.email;
}

/* -------------------------------------------------------------------------- */
/* Templates                                                                   */
/* -------------------------------------------------------------------------- */

function shell(body: string): string {
  // Minimal table-based shell. Inline styles only — Gmail/Outlook strip
  // <style> tags, so anything we want to hold up needs to live on the
  // element itself. Coral + Lora-ish stack matches the brand.
  return `
    <div style="font-family:Georgia,'Times New Roman',serif;max-width:520px;margin:0 auto;padding:24px;color:#0C0D0D">
      <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:18px;font-weight:500;margin-bottom:16px">
        give<span style="color:#E36858">nest</span>
      </div>
      ${body}
      <hr style="border:none;border-top:1px solid #E3DED6;margin:24px 0"/>
      <p style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:12px;color:#6B6860;margin:0">
        Givenest property management · Gilbert, AZ · <a style="color:#E36858" href="https://givenest.com">givenest.com</a>
      </p>
    </div>
  `;
}

/* -------------------------------------------------------------------------- */
/* Public senders                                                              */
/* -------------------------------------------------------------------------- */

export async function sendInviteWelcome(landlord: Landlord): Promise<void> {
  // The Supabase magic-link email is sent automatically by inviteUserByEmail.
  // This is a separate Givenest-branded welcome that explains what to expect.
  if (!shouldEmail(landlord, "transactional")) return;
  const html = shell(`
    <h1 style="font-size:22px;font-weight:500;margin:0 0 12px">Welcome to Givenest property management</h1>
    <p style="font-size:14px;line-height:1.6;color:#3a3835">Hi ${landlord.name.split(" ")[0]},</p>
    <p style="font-size:14px;line-height:1.6;color:#3a3835">
      We just sent you a separate sign-in email from Supabase — that link gets you into your owner dashboard for the first time, where you'll set a password and add a payment method.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#3a3835">
      In the dashboard you can:
    </p>
    <ul style="font-size:14px;line-height:1.7;color:#3a3835;padding-left:20px">
      <li>See properties under management + monthly fees</li>
      <li>Review service-log entries (landscaping, cleaning, pest control, etc.) before they're invoiced</li>
      <li>Download your PMA, leases, and inspection reports</li>
      <li>Manage your card on file via Stripe's billing portal</li>
    </ul>
    <p style="font-size:14px;line-height:1.6;color:#3a3835">
      Reply to this email if anything looks off.
    </p>
  `);
  await send({
    to: landlord.email,
    subject: "Welcome to Givenest property management",
    html,
  });
}

export async function sendInvoiceFinalized(
  landlord: Landlord,
  property: PropertyMgmt,
  invoice: LandlordInvoice
): Promise<void> {
  if (!shouldEmail(landlord, "invoice")) return;
  const html = shell(`
    <h1 style="font-size:22px;font-weight:500;margin:0 0 12px">Your ${fmtDate(invoice.period_start)} invoice is ready</h1>
    <p style="font-size:14px;line-height:1.6;color:#3a3835">
      We've finalized the invoice for <strong>${property.address}</strong>. It will be charged to your card on file.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-family:system-ui,-apple-system,sans-serif;font-size:14px">
      <tr><td style="padding:8px 0;color:#6B6860">Period</td><td style="padding:8px 0;text-align:right">${fmtDate(invoice.period_start)} – ${fmtDate(invoice.period_end)}</td></tr>
      <tr><td style="padding:8px 0;color:#6B6860;border-top:1px solid #E3DED6">Total</td><td style="padding:8px 0;text-align:right;border-top:1px solid #E3DED6"><strong>${fmtCents(invoice.amount_cents)}</strong></td></tr>
    </table>
    ${
      invoice.hosted_invoice_url
        ? `<p><a href="${invoice.hosted_invoice_url}" style="display:inline-block;background:#E36858;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-family:system-ui,-apple-system,sans-serif;font-size:14px">View full invoice</a></p>`
        : ""
    }
  `);
  await send({
    to: landlord.email,
    subject: `Givenest invoice — ${property.address}`,
    html,
  });
}

export async function sendInvoicePaid(
  landlord: Landlord,
  property: PropertyMgmt,
  invoice: LandlordInvoice
): Promise<void> {
  if (!shouldEmail(landlord, "invoice")) return;
  const html = shell(`
    <h1 style="font-size:22px;font-weight:500;margin:0 0 12px">Receipt: ${fmtCents(invoice.amount_cents)} paid</h1>
    <p style="font-size:14px;line-height:1.6;color:#3a3835">
      Your payment for <strong>${property.address}</strong> (${fmtDate(invoice.period_start)} – ${fmtDate(invoice.period_end)}) was successful.
    </p>
    ${
      invoice.hosted_invoice_url
        ? `<p style="font-size:14px"><a href="${invoice.hosted_invoice_url}" style="color:#E36858">Download invoice + receipt PDF</a></p>`
        : ""
    }
  `);
  await send({
    to: landlord.email,
    subject: `Receipt: Givenest invoice paid — ${property.address}`,
    html,
  });
}

export async function sendInvoicePaymentFailed(
  landlord: Landlord,
  property: PropertyMgmt,
  invoice: LandlordInvoice
): Promise<void> {
  // Bypass prefs — admins + landlords need to know payment failed regardless.
  const html = shell(`
    <h1 style="font-size:22px;font-weight:500;margin:0 0 12px;color:#A31F1F">Payment didn't go through</h1>
    <p style="font-size:14px;line-height:1.6;color:#3a3835">
      Stripe wasn't able to charge your card on file for the ${fmtDate(invoice.period_start)} invoice on <strong>${property.address}</strong> (${fmtCents(invoice.amount_cents)}).
    </p>
    <p style="font-size:14px;line-height:1.6;color:#3a3835">
      Most often this is an expired card or a transient bank decline. Update your payment method via the dashboard and we'll retry automatically.
    </p>
    <p><a href="https://givenest.com/landlord/dashboard/billing" style="display:inline-block;background:#E36858;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-family:system-ui,-apple-system,sans-serif;font-size:14px">Update payment method</a></p>
  `);
  await send({
    to: landlord.email,
    subject: `Action needed: payment failed — ${property.address}`,
    html,
  });

  // Notify admins so we can call the landlord if their email gets ignored.
  const adminEmails = ADMIN_NOTIFY_TO.split(",").map((e) => e.trim()).filter(Boolean);
  for (const to of adminEmails) {
    await send({
      to,
      subject: `[Givenest] Payment failed: ${landlord.name} — ${property.address}`,
      html: shell(`
        <h1 style="font-size:18px;font-weight:500;margin:0 0 12px">Landlord payment failed</h1>
        <p style="font-size:14px">${landlord.name} (${landlord.email}) — ${property.address}</p>
        <p style="font-size:14px">Invoice: ${fmtCents(invoice.amount_cents)} for ${fmtDate(invoice.period_start)} – ${fmtDate(invoice.period_end)}</p>
        ${invoice.hosted_invoice_url ? `<p><a href="${invoice.hosted_invoice_url}">Stripe invoice</a></p>` : ""}
      `),
    });
  }
}

export async function sendDocumentUploadedNotification(
  landlord: Landlord,
  doc: LandlordDocument
): Promise<void> {
  if (!shouldEmail(landlord, "general")) return;
  const html = shell(`
    <h1 style="font-size:22px;font-weight:500;margin:0 0 12px">New document available</h1>
    <p style="font-size:14px;line-height:1.6;color:#3a3835">
      <strong>${doc.title}</strong> was just uploaded to your owner dashboard.
    </p>
    <p><a href="https://givenest.com/landlord/dashboard/documents" style="display:inline-block;background:#E36858;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-family:system-ui,-apple-system,sans-serif;font-size:14px">View documents</a></p>
  `);
  await send({
    to: landlord.email,
    subject: `New document: ${doc.title}`,
    html,
  });
}
