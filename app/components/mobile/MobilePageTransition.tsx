"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type MobilePageTransitionProps = {
  children: React.ReactNode;
};

export default function MobilePageTransition({ children }: MobilePageTransitionProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(false);
    const frame = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <div className={`mobile-page-transition ${isVisible ? "is-visible" : ""}`}>{children}</div>
  );
}
