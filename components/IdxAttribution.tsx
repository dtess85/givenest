export default function IdxAttribution() {
  const year = new Date().getFullYear();
  return (
    <div className="mt-8 border-t border-border pt-6">
      <p className="text-[11px] leading-relaxed text-muted">
        IDX information is provided exclusively for consumers&apos; personal,
        non-commercial use and may not be used for any purpose other than to
        identify prospective properties consumers may be interested in
        purchasing. Data is deemed reliable but is not guaranteed accurate by
        the MLS.{" "}
        &copy; {year} Arizona Regional Multiple Listing Service, Inc. All
        rights reserved.
      </p>
    </div>
  );
}
