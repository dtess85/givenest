import { NextResponse } from "next/server";
import { Resend } from "resend";

// LOT71 project inquiries. Mirrors the Givenest contact route (same Resend
// SDK, same error shape) but routes mail to the LOT71 inbox and renders
// the house (ochre) style instead of the Givenest coral.
export async function POST(req: Request) {
  try {
    const { name, email, phone, type, message } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 }
      );
    }

    // Lazy-construct Resend so a missing RESEND_API_KEY at module load
    // doesn't crash every /api/lot71/contact request with an unrelated
    // useReducer render error from the fallback error page.
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Email sending is not configured." },
        { status: 500 }
      );
    }
    const resend = new Resend(apiKey);

    const esc = (s: string) =>
      String(s ?? "").replace(/[&<>"']/g, (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c]!)
      );

    const html = `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:520px;color:#121212">
        <h2 style="color:#B8873D;margin:0 0 4px;font-family:Georgia,serif;font-weight:500;letter-spacing:-0.01em">New project inquiry</h2>
        <p style="color:#6B6860;margin:0 0 20px;font-size:13px">via LOT71 Designs · lot71designs.com</p>
        <hr style="border:none;border-top:1px solid #E8E4DC;margin:16px 0"/>
        <p style="margin:4px 0"><strong>Name:</strong> ${esc(name)}</p>
        <p style="margin:4px 0"><strong>Email:</strong> <a href="mailto:${esc(email)}" style="color:#B8873D">${esc(email)}</a></p>
        <p style="margin:4px 0"><strong>Phone:</strong> ${esc(phone) || "—"}</p>
        <p style="margin:4px 0"><strong>Interest:</strong> ${esc(type) || "—"}</p>
        <hr style="border:none;border-top:1px solid #E8E4DC;margin:16px 0"/>
        <p style="margin:4px 0"><strong>Message:</strong></p>
        <p style="white-space:pre-wrap;line-height:1.65;margin:4px 0">${esc(message) || "—"}</p>
      </div>
    `;

    await resend.emails.send({
      from: "LOT71 Designs <onboarding@resend.dev>",
      to: process.env.LOT71_CONTACT_TO ?? "dustin@givenest.com",
      replyTo: email,
      subject: `LOT71 inquiry — ${name}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("LOT71 contact route error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
