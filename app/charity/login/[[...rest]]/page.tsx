import { SignIn } from "@clerk/nextjs";

export default function CharityLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F3EE] px-4 py-16">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <a href="/" className="inline-flex items-center gap-1 font-sans text-[18px] font-medium">
            <span>give</span>
            <span className="text-coral">nest</span>
          </a>
          <p className="mt-2 text-[13px] text-muted">Charity partner portal</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "rounded-[12px] border border-border shadow-sm",
              headerTitle: "font-serif",
              formButtonPrimary: "bg-coral hover:bg-[#d4574a]",
            },
          }}
          redirectUrl="/charity/dashboard"
        />
      </div>
    </div>
  );
}
