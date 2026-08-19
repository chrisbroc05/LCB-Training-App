"use client";

import { useEffect, useState } from "react";
import { MOBILE_MAX_WIDTH_PX } from "@/lib/mobile-ui";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`);

    const update = () => {
      setIsMobile(mediaQuery.matches);
    };

    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isMobile;
}
