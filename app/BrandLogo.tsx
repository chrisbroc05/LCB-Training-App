"use client";

import { useState } from "react";
import Image from "next/image";

type BrandLogoProps = {
  className?: string;
};

export default function BrandLogo({ className = "" }: BrandLogoProps) {
  const [logoSrc, setLogoSrc] = useState("/logo/lcb-training-logo.png");

  return (
    <Image
      src={logoSrc}
      alt="LCB Training Logo"
      fill
      className={className}
      onError={() => setLogoSrc("/next.svg")}
    />
  );
}
