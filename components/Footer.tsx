import Link from "next/link";
import Wordmark from "./Wordmark";

const columns = [
  {
    title: "Platform",
    links: [
      { label: "Buy", href: "/buy" },
      { label: "Sell", href: "/sell" },
      { label: "Charities", href: "/charities" },
      { label: "Agents", href: "/agents" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Giving", href: "#" },
      { label: "Press", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Licensing", href: "#" },
      { label: "FAQ", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#1a1a1a] bg-[#0C0D0D] px-8 pb-7 pt-11">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-9 grid grid-cols-[2fr_1fr_1fr_1fr] gap-11">
          <div>
            <div className="mb-3">
              <Wordmark size={17} dark />
            </div>
            <p className="max-w-[250px] text-[13px] font-light leading-[1.8] text-white/55">
              Arizona&apos;s giving brokerage. Every home we close funds a cause
              — donated directly by Givenest, at no extra cost.
            </p>
          </div>
          {columns.map(({ title, links }) => (
            <div key={title}>
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
                {title}
              </div>
              <div className="flex flex-col gap-[7px]">
                {links.map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="text-[13px] font-light text-white/55 transition-colors hover:text-white/80"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mb-[18px] h-px bg-white/10" />
        <div className="flex justify-between">
          <div className="text-xs text-white/35">
            &copy; {new Date().getFullYear()} Givenest. Licensed Arizona Real
            Estate Brokerage.
          </div>
          <Wordmark size={12} dark />
        </div>
      </div>
    </footer>
  );
}
