import Nav from "@/components/lot71/Nav";
import Footer from "@/components/lot71/Footer";
import ContactForm from "@/components/lot71/ContactForm";

export const metadata = {
  title: "Contact — LOT71 Designs",
};

export default function ContactPage() {
  return (
    <>
      <Nav />

      <section className="px-6 pb-20 pt-36 md:px-10 md:pb-28 md:pt-44">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid grid-cols-1 gap-14 md:grid-cols-[1fr_1fr] md:gap-24">
            <div>
              <h1 className="font-serif text-[clamp(42px,5vw,68px)] font-medium leading-[1.05] tracking-[-0.02em]">
                Interested in a <em className="italic text-[#B8873D]">LOT71 home?</em>
              </h1>
              <p className="mt-7 max-w-[480px] text-[16px] leading-[1.9] text-[#2A2A26]">
                We build a short list of homes each year and list each one
                when it&apos;s done. If you want a first look at the next one
                — or want to ask about one that&apos;s already up — this is
                the place.
              </p>
              <p className="mt-5 max-w-[480px] text-[14px] leading-[1.8] text-[#6B6860]">
                Note: LOT71 doesn&apos;t take on client builds or remodels.
              </p>

              <div className="mt-14 space-y-7 border-t border-[#E8E4DC] pt-10">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-[#6B6860]">
                    Studio
                  </div>
                  <a
                    href="mailto:hello@lot71designs.com"
                    className="mt-2 block font-serif text-[22px] text-[#121212] hover:text-[#B8873D]"
                  >
                    hello@lot71designs.com
                  </a>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-[#6B6860]">
                    Based in
                  </div>
                  <div className="mt-2 font-serif text-[22px] text-[#121212]">
                    Gilbert, Arizona
                  </div>
                </div>
              </div>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

