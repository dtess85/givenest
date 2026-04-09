export default function CharityLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F3EE] px-4 py-16">
      <div className="w-full max-w-[420px] text-center">
        <a href="/" className="inline-flex items-center gap-1 font-sans text-[18px] font-medium">
          <span>give</span>
          <span className="text-coral">nest</span>
        </a>
        <p className="mt-2 text-[13px] text-muted">Charity partner portal</p>
        <div className="mt-8 rounded-[12px] border border-border bg-white p-8 shadow-sm">
          <h1 className="font-serif text-[22px] font-medium">Sign in coming soon</h1>
          <p className="mt-3 text-[13px] text-muted">
            Charity partner login is being set up. Contact{" "}
            <a href="mailto:dustin@givenest.com" className="text-coral hover:underline">
              dustin@givenest.com
            </a>{" "}
            for access.
          </p>
          <a href="/" className="mt-6 inline-block text-[13px] text-coral hover:underline">
            ← Back to givenest.com
          </a>
        </div>
      </div>
    </div>
  );
}
