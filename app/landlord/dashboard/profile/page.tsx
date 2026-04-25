import { requireLandlord } from "@/lib/auth/require-landlord";
import DashboardHeader from "../DashboardHeader";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function LandlordProfilePage() {
  const { user, landlord } = await requireLandlord();

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      <DashboardHeader email={user.email ?? ""} />
      <div className="mx-auto max-w-[760px] px-8 py-10">
        <h1 className="mb-2 font-serif text-[28px] font-medium tracking-[-0.01em]">Profile</h1>
        <p className="mb-8 text-[14px] text-muted">
          Keep your contact info and communication preferences current. We use this for invoice receipts, statements, and the occasional important notice.
        </p>
        <ProfileForm landlord={landlord} />
      </div>
    </div>
  );
}
