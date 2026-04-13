"use client";

import { useState } from "react";
import { calcGivingPool } from "@/lib/commission";
import { fmt } from "@/lib/utils";
import GivingPanel from "@/components/GivingPanel";
import AgentPicker from "@/components/AgentPicker";
import LeadModal from "@/components/LeadModal";

export default function Sell() {
  const [value, setValue] = useState("");
  const [chosenAgent, setChosenAgent] = useState<{ name: string; office_name: string | null } | null>(null);
  const [selectedCharities, setSelectedCharities] = useState<{ name: string; ein: string }[]>([]);
  const [leadModalOpen, setLeadModalOpen] = useState(false);

  const num = parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
  const givingPool = calcGivingPool(num);

  return (
    <div>
      <div className="bg-white px-8 pb-9 pt-[52px]">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
            Seller portal
          </span>
          <h1 className="font-serif text-[clamp(26px,3.5vw,44px)] font-medium leading-[1.2] tracking-[-0.02em]">
            Sell your home.{" "}
            <em className="text-coral">Grow a cause.</em>
          </h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-16 px-8 py-11 md:grid-cols-[1fr_480px]">
        {/* Left — estimate calculator */}
        <div>
          <div className="overflow-hidden rounded-[10px] border border-border bg-white" style={{ borderTop: "3px solid var(--color-coral)" }}>
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-serif text-[15px] font-medium tracking-[-0.01em]">Estimate your giving</h3>
            </div>
            <div className="p-6">
              <label className="mb-[7px] block text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
                Estimated home value
              </label>
              <div className="relative mb-[18px]">
                <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-sm text-muted">
                  $
                </span>
                <input
                  className="w-full rounded-md border border-border bg-white py-[11px] pl-[26px] pr-[14px] text-sm outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                  placeholder="550,000"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>

              {num > 0 && (
                <div>
                  {[
                    { label: "Home value", value: fmt(num), highlight: false },
                    { label: "Estimated donation", value: fmt(givingPool), highlight: true },
                  ].map(({ label, value: v, highlight }) => (
                    <div
                      key={label}
                      className="flex items-baseline justify-between border-b border-border py-[11px]"
                    >
                      <span className={`text-sm ${highlight ? "font-medium text-black" : "font-light text-muted"}`}>
                        {label}
                      </span>
                      <span
                        className={
                          highlight
                            ? "text-[19px] font-semibold text-coral"
                            : "text-sm font-normal text-black"
                        }
                      >
                        {v}
                      </span>
                    </div>
                  ))}

                  <div className="mt-[14px] rounded-md border border-coral/20 bg-coral/[0.08] px-[13px] py-[10px]">
                    <div className="mb-[3px] text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
                      Donation to charity
                    </div>
                    <div className="text-xs font-light leading-[1.6] text-muted">
                      We donate 25% of the commission to your chosen charity. Nothing extra from you.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right — agent card + giving panel (matches buy page) */}
        <div className="flex flex-col gap-4">
          {/* Choose your agent */}
          <div className="rounded-[10px] border border-border bg-white p-[26px]" style={{ borderTop: "3px solid var(--color-coral)" }}>
            <h3 className="font-serif text-xl font-medium leading-[1.2] tracking-[-0.02em] text-black">
              Choose your agent.
            </h3>
            <p className="mt-2 text-[13px] font-light text-muted">
              Work with any agent. They handle the deal and we make the donation.
            </p>

            {/* Selected agent display */}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[11px] font-medium text-white">
                {(chosenAgent?.name ?? "Kyndall Yates").split(" ").filter((w) => w.length > 0 && w[0] === w[0].toUpperCase()).slice(0, 2).map((w) => w[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium">{chosenAgent?.name ?? "Kyndall Yates"}</div>
                {!chosenAgent ? (
                  <>
                    <a href="mailto:kyndall@givenest.com" className="block text-[12px] text-coral hover:underline truncate">kyndall@givenest.com</a>
                    <a href="tel:4804008690" className="block text-[12px] text-muted hover:text-black">(480) 400-8690</a>
                  </>
                ) : (
                  <div className="text-[12px] text-muted truncate">
                    {[chosenAgent.office_name, "Arizona"].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
              {!chosenAgent && (
                <span className="flex-shrink-0 rounded bg-coral/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-coral">
                  Givenest
                </span>
              )}
              {chosenAgent && (
                <button
                  onClick={() => setChosenAgent(null)}
                  className="flex-shrink-0 text-[12px] text-muted hover:text-coral transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Agent search */}
            <div className="mt-3">
              <AgentPicker
                defaultAgent={{
                  name: "Kyndall Yates",
                  office_name: "Givenest",
                  primary_city: "Gilbert",
                  active_listing_count: 0,
                  is_givenest: true,
                }}
                onSelect={(agent) => setChosenAgent({ name: agent.name, office_name: agent.office_name })}
              />
            </div>
            <button
              type="button"
              onClick={() => setLeadModalOpen(true)}
              className="mt-4 w-full cursor-pointer rounded-md bg-coral py-[10px] text-[13px] font-medium text-white transition-colors hover:bg-[#d4574a]"
            >
              Send request
            </button>
          </div>

          {/* Giving Panel */}
          <GivingPanel
            price={num || 500000}
            variant="seller"
            onRequestMatch={() => setLeadModalOpen(true)}
            onCharitiesChange={setSelectedCharities}
          />
        </div>
      </div>

      {/* Lead Modal */}
      <LeadModal
        open={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        propertyAddress="Sell page inquiry"
        propertyPrice={num || 500000}
        defaultAgent={chosenAgent ?? undefined}
        defaultCharities={selectedCharities}
      />
    </div>
  );
}
