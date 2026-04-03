"use client";

import { useState, useEffect } from "react";
import { fmt } from "@/lib/utils";
import { calcGivingPool } from "@/lib/commission";

const FEED = [
  { city: "Scottsdale, AZ", price: 875000, charity: "Phoenix Children's Hospital", ago: "2m ago" },
  { city: "Paradise Valley, AZ", price: 1240000, charity: "Habitat for Humanity AZ", ago: "14m ago" },
  { city: "Tempe, AZ", price: 520000, charity: "St. Mary's Food Bank", ago: "31m ago" },
  { city: "Chandler, AZ", price: 645000, charity: "Arizona Humane Society", ago: "1h ago" },
  { city: "Gilbert, AZ", price: 590000, charity: "Boys & Girls Club", ago: "2h ago" },
];

const STATS = [
  { value: "$284,190", label: "Donated to charity", highlight: false },
  { value: "82", label: "Homes closed", highlight: false },
  { value: "41", label: "Charities supported", highlight: false },
  { value: "100%", label: "Donated directly at closing, always", highlight: true },
];

export default function FeedAndStats() {
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setBarWidth(68), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
        <div>
          <span className="mb-[6px] inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
            Platform to date
          </span>
          <h2 className="mb-6 font-serif text-[clamp(20px,2.5vw,30px)] font-medium tracking-[-0.02em]">
            Early days.
            <br />
            Real impact.
          </h2>
          <div>
            {STATS.map(({ value, label, highlight }) => (
              <div
                key={label}
                className="flex items-baseline justify-between border-b border-border py-[13px]"
              >
                <span className="text-sm font-light text-muted">{label}</span>
                <span
                  className={`text-[17px] font-semibold ${
                    highlight ? "text-coral" : "text-black"
                  }`}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Giving goal */}
          <div className="mt-5 rounded-lg border border-border bg-pampas p-4">
            <div className="mb-[6px] flex justify-between">
              <span className="text-[13px] text-muted">2025 giving goal</span>
              <span className="text-[13px] font-semibold text-coral">68%</span>
            </div>
            <div className="mb-2 flex justify-between">
              <span className="text-xs font-light text-muted">
                $284,190 raised
              </span>
              <span className="text-xs font-light text-muted">
                $420,000 goal
              </span>
            </div>
            <div className="h-[3px] overflow-hidden rounded-sm bg-border">
              <div
                className="h-full rounded-sm bg-coral transition-[width] duration-[1200ms] ease-out"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        </div>
    </div>
  );
}

