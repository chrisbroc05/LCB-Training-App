import Image from "next/image";
import type { ReactNode } from "react";

type StorySlideProps = {
  index: number;
  headline: string;
  supporting: ReactNode;
  children?: ReactNode;
  footerTagline?: string;
};

export default function StorySlide({
  index,
  headline,
  supporting,
  children,
  footerTagline,
}: StorySlideProps) {
  return (
    <section
      data-slide={String(index).padStart(2, "0")}
      className="relative shrink-0 overflow-hidden bg-[#0A1628] text-[#F4F6F8]"
      style={{ width: 1080, height: 1920 }}
    >
      <div
        className="pointer-events-none absolute rounded-full blur-3xl"
        style={{
          width: 520,
          height: 520,
          top: -120,
          right: -80,
          background: "rgba(45, 106, 79, 0.22)",
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full blur-3xl"
        style={{
          width: 420,
          height: 420,
          bottom: 120,
          left: -100,
          background: "rgba(82, 183, 136, 0.14)",
        }}
      />

      <div className="absolute left-0 right-0 top-10 flex justify-center">
        <div className="relative h-16 w-40">
          <Image
            src="/logo/lcb-training-logo.png"
            alt="LCB Training"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      <div
        className="absolute left-0 flex flex-col items-center px-12 text-center"
        style={{ top: 250, width: 1080, height: 1420 }}
      >
        <h2 className="max-w-[920px] text-[72px] font-black uppercase leading-[0.95] tracking-tight text-[#F4F6F8]">
          {headline}
        </h2>
        <p className="mt-6 max-w-[820px] text-[34px] font-medium leading-snug text-[#d4dde8]">
          {supporting}
        </p>
        {children ? <div className="mt-10 w-full flex-1">{children}</div> : null}
        {footerTagline ? (
          <p className="mt-auto pb-2 text-[30px] font-semibold tracking-wide text-[#52B788]">
            {footerTagline}
          </p>
        ) : null}
      </div>

      <p className="absolute bottom-10 left-0 right-0 text-center text-[28px] font-semibold tracking-[0.18em] text-[#52B788]">
        @lcbtraining
      </p>
    </section>
  );
}
