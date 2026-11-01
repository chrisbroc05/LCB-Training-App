"use client";

import { useRouter } from "next/navigation";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

type AdminOrgCommissionsPickerProps = {
  organizations: Array<{ id: string; name: string }>;
  selectedOrgId: string;
};

export default function AdminOrgCommissionsPicker({
  organizations,
  selectedOrgId,
}: AdminOrgCommissionsPickerProps) {
  const router = useRouter();

  return (
    <label className="block text-sm text-zinc-400">
      Organization
      <select
        value={selectedOrgId}
        onChange={(event) => {
          const orgId = event.target.value;
          if (!orgId) {
            router.push(ADMIN_ROUTES.business.commissions);
            return;
          }
          router.push(`${ADMIN_ROUTES.business.commissions}?orgId=${encodeURIComponent(orgId)}`);
        }}
        className="mt-1 w-full max-w-md rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100"
      >
        <option value="">Select organization...</option>
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    </label>
  );
}
