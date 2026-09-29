import { Suspense } from "react";

export default function ParentMessagesLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="px-4 py-10 text-sm text-zinc-400">Loading...</div>}>{children}</Suspense>;
}
