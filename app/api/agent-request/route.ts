import { NextResponse } from "next/server";
import { Resend } from "resend";
import { pool } from "@/lib/db";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { name, email, phone, agentName, agentOffice, propertyAddress, message, source, charity, homeValue, givingAmount } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const subjectParts = [agentName, propertyAddress].filter(Boolean).join(" · ");
    const sourceLabel = source === "directory" ? "agent directory" : "property page";

    // Send email (existing behaviour)
    await resend.emails.send({
      from: "Givenest Leads <onboarding@resend.dev>",
      to: "dustin@givenest.com",
      subject: `Agent request — ${subjectParts}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px">
          <h2 style="color:#E36858;margin-bottom:4px">Agent Request</h2>
          <p style="color:#6B6860;margin-top:0">via Givenest ${sourceLabel}</p>
          <hr style="border:none;border-top:1px solid #E3DED6;margin:16px 0"/>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Phone:</strong> ${phone || "—"}</p>
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}
          <hr style="border:none;border-top:1px solid #E3DED6;margin:16px 0"/>
          <p><strong>Agent requested:</strong> ${agentName || "—"}</p>
          ${agentOffice ? `<p><strong>Brokerage:</strong> ${agentOffice}</p>` : ""}
          ${propertyAddress ? `<p><strong>Property:</strong> ${propertyAddress}</p>` : ""}
          ${charity ? `<hr style="border:none;border-top:1px solid #E3DED6;margin:16px 0"/><p><strong>Charity:</strong> ${charity}</p>` : ""}
          ${homeValue ? `<p><strong>Home value:</strong> ${homeValue}</p>` : ""}
          ${givingAmount ? `<p><strong>Est. donation:</strong> ${givingAmount}</p>` : ""}
        </div>
      `,
    });

    // Persist to agent_inquiries table
    await pool.query(
      `INSERT INTO agent_inquiries (agent_name, agent_office, buyer_name, buyer_email, buyer_phone, property_address, message, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [agentName || null, agentOffice || null, name, email, phone || null, propertyAddress || null, message || null, source || null],
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Agent request route error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
