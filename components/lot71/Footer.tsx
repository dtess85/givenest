import Link from "next/link";
import Wordmark from "./Wordmark";

export default function Footer() {
  return (
    <footer className="bg-[#111111] px-6 pb-10 pt-20 text-white md:px-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 gap-14 md:grid-cols-[2fr_1fr_1fr] md:gap-12">
          <div>
            <Wordmark size={22} dark />
            <p className="mt-6 max-w-[340px] text-[14px] leading-[1.9] text-[#8E8A82]">
              A develop-and-build studio in Gilbert, Arizona. We build, remodel,
              and design residential projects, one at a time.
            </p>
          </div>

          <div>
            <div className="mb-4 text-[10px] uppercase tracking-[0.24em] text-[#5E5A52]">
              Studio
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/lot71/work" className="text-[14px] text-[#D7D2C8] hover:text-white">
                Work
              </Link>
              <Link href="/lot71/story" className="text-[14px] text-[#D7D2C8] hover:text-white">
                Story
              </Link>
              <Link href="/lot71/contact" className="text-[14px] text-[#D7D2C8] hover:text-white">
                Contact
              </Link>
            </div>
          </div>

          <div>
            <div className="mb-4 text-[10px] uppercase tracking-[0.24em] text-[#5E5A52]">
              Reach
            </div>
            <div className="flex flex-col gap-3">
              <a
                href="mailto:studio@lot71designs.com"
                className="text-[14px] text-[#D7D2C8] hover:text-white"
              >
                studio@lot71designs.com
              </a>
              <span className="text-[14px] text-[#8E8A82]">
                Gilbert, Arizona
              </span>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-[#262626] pt-6 text-[12px] text-[#5E5A52] md:flex-row">
          <span>&copy; {new Date().getFullYear()} LOT71 Designs. All rights reserved.</span>
          <span>Built in Arizona.</span>
        </div>
      </div>
    </footer>
  );
}
