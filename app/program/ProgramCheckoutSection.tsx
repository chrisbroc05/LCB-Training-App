"use client";

import { Suspense } from "react";
import TwelveWeekProgramCheckoutButton from "@/app/components/TwelveWeekProgramCheckoutButton";

type ProgramCheckoutSectionProps = {
  isLoggedIn: boolean;
  autoStartCheckout: boolean;
};

function ProgramCheckoutSectionContent({
  isLoggedIn,
  autoStartCheckout,
}: ProgramCheckoutSectionProps) {
  return (
    <TwelveWeekProgramCheckoutButton
      isLoggedIn={isLoggedIn}
      autoStartCheckout={autoStartCheckout}
      label="Start the Twelve Week Program"
    />
  );
}

export default function ProgramCheckoutSection(props: ProgramCheckoutSectionProps) {
  return (
    <Suspense fallback={<div className="h-12" />}>
      <ProgramCheckoutSectionContent {...props} />
    </Suspense>
  );
}
