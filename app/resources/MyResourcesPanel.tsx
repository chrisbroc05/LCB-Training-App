"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  MyResourceGroupItem,
  MyResourcesViewModel,
  MyResourceTreeItem,
} from "@/lib/my-resources-shared";

type MyResourcesPanelProps = {
  model: MyResourcesViewModel;
};

function TreeItem({ item, depth }: { item: MyResourceTreeItem; depth: number }) {
  if (item.kind === "link") {
    return (
      <div style={{ paddingLeft: depth * 12 }} className="py-1">
        <Link
          href={item.href}
          className="text-sm font-semibold text-[#52B788] underline-offset-2 hover:underline"
        >
          {item.label}
        </Link>
        {item.description ? (
          <p className="mt-1 text-xs text-zinc-500">{item.description}</p>
        ) : null}
      </div>
    );
  }

  if (item.kind === "pdf") {
    return (
      <div style={{ paddingLeft: depth * 12 }} className="py-1">
        <Link
          href={item.viewerHref}
          className="text-sm font-semibold text-[#52B788] underline-offset-2 hover:underline"
        >
          {item.label}
        </Link>
      </div>
    );
  }

  return <ExpandableGroup item={item} depth={depth} />;
}

function ExpandableGroup({ item, depth }: { item: MyResourceGroupItem; depth: number }) {
  const [open, setOpen] = useState(depth < 2);

  return (
    <div style={{ paddingLeft: depth * 12 }} className="py-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 text-left text-sm font-semibold text-zinc-100"
        aria-expanded={open}
      >
        <span className="text-[#52B788]">{open ? "-" : "+"}</span>
        {item.label}
      </button>
      {open ? (
        <div className="mt-1 border-l border-[#2b3650] pl-3">
          {item.children.map((child) => (
            <TreeItem key={child.id} item={child} depth={0} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function MyResourcesPanel({ model }: MyResourcesPanelProps) {
  if (!model.hasAny) {
    return (
      <div className="rounded-2xl border border-dashed border-[#2b3650] bg-black/20 px-6 py-12 text-center">
        <p className="text-sm text-zinc-400">
          Nothing here yet. Browse free and paid resources, or upgrade your membership to unlock
          more.
        </p>
        <Link
          href="/resources?tab=browse"
          className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-[#2D6A4F] px-5 py-2 text-sm font-semibold text-white hover:bg-[#52B788]"
        >
          Browse resources
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {model.sections.map((section) => (
        <section
          key={section.id}
          className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6"
        >
          <h2 className="text-xl font-semibold text-zinc-100">{section.title}</h2>
          <div className="mt-4 space-y-1">
            {section.items.map((item) => (
              <TreeItem key={item.id} item={item} depth={0} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
