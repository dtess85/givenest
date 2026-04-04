import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { name, email, phone, charity, homeValue, givingAmount } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    await resend.emails.send({
      from: "Givenest Leads <onboarding@resend.dev>",
      to: "dustin@givenest.com",
      subject: `New seller lead — ${charity}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px">
          <h2 style="color:#E36858;margin-bottom:4px">New Seller Lead</h2>
          <p style="color:#6B6860;margin-top:0">via Givenest Sell page</p>
          <hr style="border:none;border-top:1px solid #E3DED6;margin:16px 0"/>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Phone:</strong> ${phone || "—"}</p>
          <hr style="border:none;border-top:1px solid #E3DED6;margin:16px 0"/>
          <p><strong>Charity:</strong> ${charity}</p>
          <p><strong>Home value:</strong> ${homeValue || "not entered"}</p>
          <p><strong>Estimated donation:</strong> ${givingAmount || "—"}</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact route error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
