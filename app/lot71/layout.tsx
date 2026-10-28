import type { Metadata } from "next";
import "./lot71.css";

export const metadata: Metadata = {
  title: "LOT71 Designs — Build, remodel, and design in Gilbert, Arizona",
  description:
    "LOT71 Designs is a design-and-build studio in Gilbert, Arizona — new homes, whole-home remodels, and interiors, one at a time.",
};

// Wraps every /lot71/* page in the LOT71 brand surface — scoped background
// color and a shared stacking context the nav fixes against. Nav/Footer
// are chosen per-page because the home page has a transparent-over-hero nav
// and the inner pages have the solid variant.
export default function Lot71Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="lot71-brand min-h-screen bg-[#FAFAF7] text-[#121212]">
      {children}
    </div>
  );
}
