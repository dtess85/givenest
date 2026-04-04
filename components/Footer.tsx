import Link from "next/link";
import Wordmark from "./Wordmark";

export default function Footer() {
  return (
    <div
      style={{
        backgroundColor: "#000000",
        color: "#ffffff",
        padding: "48px 32px 28px",
        borderTop: "1px solid #222",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="mb-9 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-[2fr_1fr_1fr_1fr] sm:gap-11">
          <div className="col-span-2 sm:col-span-1">
            <div style={{ marginBottom: 12 }}>
              <Wordmark size={17} dark />
            </div>
            <p style={{ color: "#999999", fontSize: 13, lineHeight: 1.8, maxWidth: 260 }}>
              Arizona&apos;s giving brokerage. Every home we close funds a cause
              — donated directly by Givenest, at no extra cost.
            </p>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#666666", marginBottom: 12 }}>
              Platform
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <Link href="/buy" style={{ color: "#999999", fontSize: 13, textDecoration: "none" }}>Buy</Link>
              <Link href="/sell" style={{ color: "#999999", fontSize: 13, textDecoration: "none" }}>Sell</Link>
              <Link href="/charities" style={{ color: "#999999", fontSize: 13, textDecoration: "none" }}>Charities</Link>
              <Link href="/agents" style={{ color: "#999999", fontSize: 13, textDecoration: "none" }}>Agents</Link>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#666666", marginBottom: 12 }}>
              Company
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <Link href="/about" style={{ color: "#999999", fontSize: 13, textDecoration: "none" }}>About</Link>
              <Link href="/giving" style={{ color: "#999999", fontSize: 13, textDecoration: "none" }}>Giving</Link>
              <Link href="/press" style={{ color: "#999999", fontSize: 13, textDecoration: "none" }}>Press</Link>
              <Link href="/contact" style={{ color: "#999999", fontSize: 13, textDecoration: "none" }}>Contact</Link>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#666666", marginBottom: 12 }}>
              Legal
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <Link href="/privacy" style={{ color: "#999999", fontSize: 13, textDecoration: "none" }}>Privacy</Link>
              <Link href="/terms" style={{ color: "#999999", fontSize: 13, textDecoration: "none" }}>Terms</Link>
              <Link href="/licensing" style={{ color: "#999999", fontSize: 13, textDecoration: "none" }}>Licensing</Link>
              <Link href="/faq" style={{ color: "#999999", fontSize: 13, textDecoration: "none" }}>FAQ</Link>
            </div>
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: "#333333", marginBottom: 18 }} />

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#666666" }}>
            &copy; 2026 Givenest. Licensed Arizona Real Estate Brokerage.
          </span>
          <Wordmark size={12} dark />
        </div>
      </div>
    </div>
  );
}
