import type { ReactNode } from "react";

type HomepageVideoFrameProps = {
  aspectClassName: string;
  children: ReactNode;
  className?: string;
  /** Intro hero uses a border; sample coaching video does not. */
  bordered?: boolean;
};

export const homepageVideoFrameInnerClassName =
  "relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/40";

export const homepageVideoFrameBorderClassName = "border border-[#2b3650]";

export default function HomepageVideoFrame({
  aspectClassName,
  children,
  className = "",
  bordered = true,
}: HomepageVideoFrameProps) {
  const borderClass = bordered ? homepageVideoFrameBorderClassName : "";

  return (
    <div
      className={`${homepageVideoFrameInnerClassName} ${borderClass} ${aspectClassName} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
