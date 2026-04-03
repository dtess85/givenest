"use client";

import Link from "next/link";

const team = [
  {
    initials: "KY",
    name: "Kyndall Yates",
    title: "Co-Founder · Salesperson",
    email: "kyndall@givenest.com",
    phone: "(480) 400-8690",
  },
  {
    initials: "DT",
    name: "Dustin Tessendorf",
    title: "Co-Founder · Designated Broker",
    email: "dustin@givenest.com",
    phone: "(480) 779-7204",
  },
];

const differentiators = [
  {
    title: "Licensed in Arizona",
    desc: "You're working with a fully licensed professional, backed by the Givenest brokerage.",
  },
  {
    title: "Driven by more than commission",
    desc: "Your agent isn't just focused on the deal — they're invested in making your transaction meaningful.",
  },
  {
    title: "Guidance beyond the transaction",
    desc: "From choosing a cause to handling the details, your agent makes the giving simple and seamless.",
  },
  {
    title: "Full support, start to finish",
    desc: "From offer to closing, you're supported by experienced agents and a platform built to keep everything on track.",
  },
];

export default function Agents() {
  return (
    <div>
      {/* Hero */}
      <div style={{ position: "relative", height: "520px", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1600&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center 30%",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(12,13,13,0.25) 0%, rgba(12,13,13,0.72) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "0 48px 52px",
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.65)",
              marginBottom: "16px",
            }}
          >
            The team
          </div>
          <h1
            style={{
              fontFamily: "Lora, serif",
              fontSize: "clamp(36px, 5vw, 60px)",
              fontWeight: 600,
              lineHeight: 1.1,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              margin: "0 0 16px",
              maxWidth: "640px",
            }}
          >
            The team behind
            <br />
            <em style={{ color: "#E36858" }}>the impact.</em>
          </h1>
          <p
            style={{
              fontSize: "17px",
              fontWeight: 300,
              color: "rgba(255,255,255,0.80)",
              maxWidth: "480px",
              lineHeight: 1.75,
              margin: 0,
            }}
          >
            Every Givenest closing is handled by licensed agents — bringing care,
            expertise, and meaning to every transaction.
          </p>
        </div>
      </div>

      {/* Team cards */}
      <div style={{ background: "#F4F3EE", padding: "72px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "24px",
            }}
          >
            {team.map((agent) => (
              <div
                key={agent.name}
                style={{
                  background: "#FFFFFF",
                  borderRadius: "12px",
                  border: "1px solid #E3DED6",
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "28px 28px 28px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        background: "#E36858",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        fontWeight: 500,
                        color: "#FFFFFF",
                        flexShrink: 0,
                      }}
                    >
                      {agent.initials}
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: "Lora, serif",
                          fontSize: "19px",
                          fontWeight: 600,
                          color: "#0C0D0D",
                          marginBottom: "3px",
                        }}
                      >
                        {agent.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6B6860",
                          fontWeight: 300,
                        }}
                      >
                        {agent.title}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      height: "1px",
                      background: "#E3DED6",
                      marginBottom: "16px",
                    }}
                  />
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: "6px" }}
                  >
                    <a
                      href={`mailto:${agent.email}`}
                      style={{
                        fontSize: "13px",
                        fontWeight: 300,
                        color: "#E36858",
                        textDecoration: "none",
                      }}
                    >
                      {agent.email}
                    </a>
                    <a
                      href={`tel:${agent.phone.replace(/\D/g, "")}`}
                      style={{
                        fontSize: "13px",
                        fontWeight: 300,
                        color: "#6B6860",
                        textDecoration: "none",
                      }}
                    >
                      {agent.phone}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Givenest agents */}
      <div style={{ background: "#FFFFFF", padding: "72px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "80px",
              alignItems: "start",
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "Lora, serif",
                  fontSize: "clamp(26px, 3vw, 38px)",
                  fontWeight: 600,
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                  color: "#0C0D0D",
                  margin: "0 0 16px",
                }}
              >
                What makes our
                <br />
                <em style={{ color: "#E36858" }}>agents</em> different.
              </h2>
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 300,
                  color: "#6B6860",
                  lineHeight: 1.85,
                  margin: 0,
                }}
              >
                Every Givenest agent is committed to more than just closing deals
                — they make every closing meaningful. They represent your
                interests, and the impact your transaction creates.
              </p>
            </div>
            <div>
              {differentiators.map(({ title, desc }) => (
                <div
                  key={title}
                  style={{
                    display: "flex",
                    gap: "14px",
                    padding: "16px 0",
                    borderBottom: "1px solid #E3DED6",
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#E36858",
                      flexShrink: 0,
                      marginTop: "7px",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#0C0D0D",
                        marginBottom: "4px",
                      }}
                    >
                      {title}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 300,
                        color: "#6B6860",
                        lineHeight: 1.7,
                      }}
                    >
                      {desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Join CTA */}
      <div style={{ background: "#F4F3EE", padding: "80px 48px" }}>
        <div
          style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}
        >
          <div
            style={{
              width: "48px",
              height: "3px",
              background: "#E36858",
              margin: "0 auto 32px",
            }}
          />
          <h2
            style={{
              fontFamily: "Lora, serif",
              fontSize: "clamp(28px, 3.5vw, 44px)",
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "#0C0D0D",
              margin: "0 0 16px",
            }}
          >
            A career worth
            <br />
            <em style={{ color: "#E36858" }}>talking about.</em>
          </h2>
          <p
            style={{
              fontSize: "16px",
              fontWeight: 300,
              color: "#6B6860",
              lineHeight: 1.85,
              margin: "0 0 40px",
            }}
          >
            We&apos;re selective by design. If you believe real estate can do
            more than close deals, you&apos;ll fit right in.
          </p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href="mailto:dustin@givenest.com"
              style={{
                background: "#E36858",
                color: "#FFFFFF",
                padding: "14px 36px",
                fontSize: "15px",
                fontWeight: 500,
                borderRadius: "6px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Apply to join
            </a>
            <Link
              href="/buy"
              style={{
                background: "transparent",
                color: "#6B6860",
                border: "1px solid #E3DED6",
                padding: "14px 36px",
                fontSize: "15px",
                fontWeight: 400,
                borderRadius: "6px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              See how it works
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
