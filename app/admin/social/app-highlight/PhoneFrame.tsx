import type { ReactNode } from "react";

type PhoneFrameProps = {
  children: ReactNode;
  title?: string;
};

export default function PhoneFrame({ children, title = "LCB Training" }: PhoneFrameProps) {
  return (
    <div className="mx-auto w-[420px] rounded-[36px] border-[6px] border-[#1f2937] bg-black p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
      <div className="overflow-hidden rounded-[28px] bg-[#0A1628]">
        <div className="flex items-center justify-between bg-[#0b1324] px-4 py-2">
          <span className="text-[11px] font-semibold text-zinc-400">9:41</span>
          <div className="h-5 w-24 rounded-full bg-black" />
          <span className="text-[11px] font-semibold text-zinc-400">100%</span>
        </div>
        <div className="border-b border-[#18243a] px-4 py-3">
          <p className="text-center text-sm font-semibold text-[#F4F6F8]">{title}</p>
        </div>
        <div className="max-h-[640px] overflow-hidden bg-[#0A1628]">{children}</div>
        <div className="flex items-center justify-around border-t border-[#18243a] bg-[#0b1324] px-2 py-2">
          {["Today", "Home", "Playbook", "Train", "Resources"].map((label, index) => (
            <div key={label} className="flex flex-col items-center gap-1 px-1">
              <span
                className={`h-2 w-2 rounded-full ${index === 0 ? "bg-[#52B788]" : "bg-[#2b3650]"}`}
              />
              <span
                className={`text-[9px] font-semibold ${index === 0 ? "text-[#52B788]" : "text-zinc-500"}`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
