export default function CharityDashboard() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F3EE] px-8">
      <div className="max-w-[480px] text-center">
        <h1 className="mb-3 font-serif text-[28px] font-medium">Dashboard coming soon</h1>
        <p className="mb-6 text-[14px] font-light text-muted">
          Charity partner login is being set up. Contact{" "}
          <a href="mailto:dustin@givenest.com" className="text-coral hover:underline">
            dustin@givenest.com
          </a>{" "}
          for access.
        </p>
        <a href="/" className="text-[13px] text-coral hover:underline">← Back to givenest.com</a>
      </div>
    </div>
  );
}
