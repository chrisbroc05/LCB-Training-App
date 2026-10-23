import Link from "next/link";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
};

export default function AdminPageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
}: AdminPageHeaderProps) {
  return (
    <header className="mb-6 space-y-2">
      {backHref ? (
        <Link href={backHref} className="inline-flex text-sm font-semibold text-[#52B788]">
          {backLabel}
        </Link>
      ) : null}
      <h1 className="text-xl font-semibold text-zinc-100 sm:text-2xl md:text-3xl">{title}</h1>
      {description ? <p className="text-sm text-zinc-400">{description}</p> : null}
    </header>
  );
}
