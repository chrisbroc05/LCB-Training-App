"use client";

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
      const response = await fetch("/api/admin/program/overview");
      const data = (await response.json().catch(() => ({}))) as {
        players?: Array<{ enrollmentId: string; name: string }>;
      };
      setLoading(false);
      if (response.ok && data.players) {
        setPlayers(
          data.players.map((player) => ({
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
