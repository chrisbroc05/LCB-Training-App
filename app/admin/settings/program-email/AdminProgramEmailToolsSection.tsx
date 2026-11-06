"use client";

import { adminFetchJson } from "@/lib/admin-fetch-shared";
import { useEffect, useState } from "react";
import AdminProgramEmailTools from "@/app/admin/program/AdminProgramEmailTools";

type PlayerOption = {
  enrollmentId: string;
  name: string;
};

export default function AdminProgramEmailToolsSection() {
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await adminFetchJson<{ players?: Array<{ enrollmentId: string; name: string }> }>(
        "/api/admin/program/overview",
        { cache: "no-store" },
        { context: "admin-program-overview-email-tools" },
      );
      setLoading(false);
      if (res.ok && res.data.players) {
        setPlayers(
          res.data.players.map((player) => ({
            enrollmentId: player.enrollmentId,
            name: player.name,
          })),
        );
      }
    };
    void load();
  }, []);

  if (loading) {
    return <p className="text-sm text-zinc-400">Loading program players...</p>;
  }

  return <AdminProgramEmailTools players={players} />;
}
