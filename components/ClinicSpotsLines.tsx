type ClinicSpotsLinesProps = {
  lines: string[];
  className?: string;
};

/** Per-day spots: stacked on mobile, pipe-separated on wider screens. */
export default function ClinicSpotsLines({ lines, className = "" }: ClinicSpotsLinesProps) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <p className={className}>
      {lines.map((line, index) => (
        <span key={`${line}-${index}`} className="block sm:inline">
          {index > 0 ? <span className="hidden sm:inline"> | </span> : null}
          {line}
        </span>
      ))}
    </p>
  );
}
