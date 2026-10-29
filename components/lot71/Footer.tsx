import Image from "next/image";
import Link from "next/link";

// Intrinsic dims of /public/lot71/brand/wordmark-light.png.
// Rendered at 36px tall → ~130px wide; next/image serves resized files.
const WORDMARK_H = 36;
const WORDMARK_W = Math.round((1260 / 349) * WORDMARK_H);

export default function Footer() {
  return (
    <footer className="bg-[#111111] px-6 pb-10 pt-20 text-white md:px-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 gap-14 md:grid-cols-[2fr_1fr_1fr] md:gap-12">
          <div>
            <Image
              src="/lot71/brand/wordmark-light.png"
              alt="LOT71 Designs"
              width={WORDMARK_W}
              height={WORDMARK_H}
              className="h-9 w-auto"
            />
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
                href="mailto:hello@lot71designs.com"
                className="text-[14px] text-[#D7D2C8] hover:text-white"
              >
                hello@lot71designs.com
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
