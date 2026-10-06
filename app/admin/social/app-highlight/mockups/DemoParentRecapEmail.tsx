type DemoParentRecapEmailProps = {
  html: string;
};

export default function DemoParentRecapEmail({ html }: DemoParentRecapEmailProps) {
  return (
    <div className="max-h-[640px] overflow-hidden rounded-xl border border-[#d1d5db] bg-white">
      <iframe
        title="Parent weekly recap email"
        srcDoc={html}
        className="h-[640px] w-full scale-[0.92] origin-top bg-white"
        scrolling="no"
      />
    </div>
  );
}
