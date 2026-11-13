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
      width={776}
      height={768}
      className={`h-full w-full object-contain ${className}`.trim()}
      sizes="160px"
      onError={() => setLogoSrc("/next.svg")}
    />
  );
}
