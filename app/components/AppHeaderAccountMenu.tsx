"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

type AppHeaderAccountMenuProps = {
  isAdmin: boolean;
  firstName: string;
  initial: string;
};

function menuItemClass(active: boolean) {
  return active
    ? "block rounded-lg bg-[#22c55e]/15 px-3 py-2.5 text-sm font-semibold text-[#9df3bd]"
    : "block rounded-lg px-3 py-2.5 text-sm text-zinc-200 transition hover:bg-[#1a253a] hover:text-[#9df3bd]";
}

export default function AppHeaderAccountMenu({
  isAdmin,
  firstName,
  initial,
}: AppHeaderAccountMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const onMemberPages = !pathname.startsWith("/admin");

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || !rootRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  const handleLogout = () => {
    close();
    void signOut({ callbackUrl: "/auth" });
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="app-header-account-link"
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="app-header-account-name">{firstName}</span>
        <span className="app-header-account-avatar">{initial}</span>
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[200px] rounded-xl border border-[#2b3650] bg-[#0b1324] p-2 shadow-2xl shadow-black/50"
          role="menu"
        >
          {isAdmin && onMemberPages ? (
            <Link href="/admin" onClick={close} className={menuItemClass(false)} role="menuitem">
              Admin
            </Link>
          ) : null}
          <Link
            href="/profile"
            onClick={close}
            className={menuItemClass(pathname.startsWith("/profile"))}
            role="menuitem"
          >
            Profile
          </Link>
          <Link
            href="/settings"
            onClick={close}
            className={menuItemClass(pathname.startsWith("/settings"))}
            role="menuitem"
          >
            Settings
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 block w-full rounded-lg px-3 py-2.5 text-left text-sm text-red-200 transition hover:bg-red-500/15"
            role="menuitem"
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
