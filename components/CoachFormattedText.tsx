import type { ReactNode } from "react";
import {
  parseCoachText,
  type CoachTextBlock,
  type CoachTextInline,
} from "@/lib/coach-text-format-shared";

type CoachFormattedTextProps = {
  text: string;
  className?: string;
};

function renderInlines(inlines: CoachTextInline[]): ReactNode[] {
  return inlines.map((part, index) =>
    part.type === "bold" ? (
      <strong key={index} className="font-semibold text-zinc-100">
        {part.value}
      </strong>
    ) : (
      <span key={index}>{part.value}</span>
    ),
  );
}

function renderBlock(block: CoachTextBlock, index: number): ReactNode {
  if (block.type === "paragraph") {
    return (
      <p key={index} className="whitespace-pre-wrap">
        {block.lines.map((line, lineIndex) => (
          <span key={lineIndex}>
            {lineIndex > 0 ? <br /> : null}
            {renderInlines(line)}
          </span>
        ))}
      </p>
    );
  }

  if (block.type === "ul") {
    return (
      <ul key={index} className="list-disc space-y-1 pl-5">
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>{renderInlines(item)}</li>
        ))}
      </ul>
    );
  }

  return (
    <ol key={index} className="list-decimal space-y-1 pl-5">
      {block.items.map((item, itemIndex) => (
        <li key={itemIndex}>{renderInlines(item)}</li>
      ))}
    </ol>
  );
}

export default function CoachFormattedText({ text, className }: CoachFormattedTextProps) {
  const blocks = parseCoachText(text);
  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}
