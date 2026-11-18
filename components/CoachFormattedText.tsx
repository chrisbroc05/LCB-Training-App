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
  return inlines.map((part, index) => {
    if (part.type === "bold") {
      return (
        <strong key={index} className="font-semibold text-zinc-100">
          {part.value}
        </strong>
      );
    }
    if (part.type === "link") {
      return (
        <a
          key={index}
          href={part.href}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-medium text-[#52B788] underline underline-offset-2 hover:text-[#9df3bd]"
        >
          {part.value}
        </a>
      );
    }
    return <span key={index}>{part.value}</span>;
  });
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
