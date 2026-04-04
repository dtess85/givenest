import Link from "next/link";
import { AGENTS } from "@/lib/mock-data";

export default function About() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-white px-8 pb-16 pt-[80px]">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
            Our story
          </span>
          <h1 className="mb-5 max-w-[700px] font-serif text-[clamp(36px,5vw,60px)] font-medium leading-[1.1] tracking-[-0.02em]">
            Real estate with{" "}
            <em className="text-coral">a reason.</em>
          </h1>
          <p className="max-w-[560px] text-[17px] font-light leading-[1.8] text-muted">
            Givenest is an Arizona real estate brokerage built on a simple belief: every home sale is an opportunity to do something meaningful. So we made giving a part of every closing.
          </p>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Mission */}
      <div className="bg-[#F4F3EE] px-8 py-16">
        <div className="mx-auto max-w-[1100px] grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <span className="mb-3 inline-block text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
              Why we built this
            </span>
            <h2 className="mb-5 font-serif text-[clamp(26px,3.5vw,38px)] font-medium leading-[1.15] tracking-[-0.02em]">
              If we&apos;re moving hundreds of thousands of dollars in every transaction, why doesn&apos;t any of that go somewhere that matters?
            </h2>
          </div>
          <div className="flex flex-col justify-center gap-5">
            <p className="text-[15px] font-light leading-[1.8] text-muted">
              Givenest was founded by Dustin Tessendorf and Kyndall Yates in Arizona with a simple question.
            </p>
            <p className="text-[15px] font-light leading-[1.8] text-muted">
              Dustin, who grew up in South Africa, saw firsthand the impact that giving can have — and wanted to build something that made it part of everyday life. Kyndall shared that vision: a desire to help people through one of the biggest transactions of their lives while being part of something bigger than herself.
            </p>
            <p className="text-[15px] font-light leading-[1.8] text-muted">
              At every closing, Givenest donates 25% of its commission to a charity chosen by the client. No extra cost. No gimmicks. Just a different way to buy and sell real estate.
            </p>
            <p className="text-[15px] font-light leading-[1.8] text-muted">
              Beyond the transaction, their mission is simple: to empower agents to build meaningful careers — providing for their families while making a real impact with every closing.
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white px-8 py-16">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="mb-10 font-serif text-[clamp(24px,3vw,34px)] font-medium tracking-[-0.02em]">
            How the giving works
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { n: "01", title: "You choose your charity", body: "Pick from 1.8M+ nonprofits registered with the IRS — from a local food bank to a global relief org." },
              { n: "02", title: "We handle the donation", body: "At closing, Givenest donates 25% of its commission directly to your chosen charity. No paperwork for you." },
              { n: "03", title: "You pay nothing extra", body: "The donation comes from Givenest&apos;s side — your commission structure and closing costs stay the same." },
            ].map((item) => (
              <div key={item.n} className="rounded-[10px] border border-border bg-white p-6">
                <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">{item.n}</div>
                <div className="mb-2 font-serif text-[18px] font-medium">{item.title}</div>
                <p className="text-[14px] font-light leading-[1.7] text-muted">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/giving" className="text-[13px] text-coral hover:underline">
              Learn more about how giving works →
            </Link>
          </div>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Team */}
      <div className="bg-[#F4F3EE] px-8 py-16">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="mb-2 font-serif text-[clamp(24px,3vw,34px)] font-medium tracking-[-0.02em]">
            The team
          </h2>
          <p className="mb-10 text-[14px] font-light text-muted">Licensed Arizona agents committed to more than just closing deals.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              ...AGENTS,
              { name: "Dustin Tessendorf", initials: "DT", email: "dustin@givenest.com", phone: "(480) 234-5678", markets: "", closings: 0, instagram: "https://www.instagram.com/dtess/" },
            ].map((a) => (
              <div key={a.initials} className="flex items-center gap-4 rounded-[10px] border border-border bg-white p-5">
                <div className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-full bg-coral text-[13px] font-medium text-white">
                  {a.initials}
                </div>
                <div>
                  <div className="font-medium">{a.name}</div>
                  <a href={`mailto:${a.email}`} className="block text-[12px] text-coral hover:underline">{a.email}</a>
                  <a href={`tel:${a.phone.replace(/\D/g, "")}`} className="block text-[12px] text-muted hover:text-black">{a.phone}</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-black px-8 py-16 text-center">
        <div className="mx-auto max-w-[600px]">
          <h2 className="mb-4 font-serif text-[clamp(24px,3vw,36px)] font-medium text-white tracking-[-0.02em]">
            Ready to make your move count?
          </h2>
          <p className="mb-8 text-[15px] font-light leading-[1.8] text-white/60">
            Every Givenest closing funds a cause you believe in — at no extra cost to you.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/buy" className="rounded-md bg-coral px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#d4574a]">
              Browse homes
            </Link>
            <Link href="/sell" className="rounded-md border border-white/20 px-6 py-3 text-[14px] font-medium text-white transition-colors hover:border-white/40">
              Get a selling estimate
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
