import PublicCompactHeader from "@/components/PublicCompactHeader";

type PublicPageShellProps = {
  children: React.ReactNode;
  isLoggedIn?: boolean;
};

export default function PublicPageShell({ children, isLoggedIn }: PublicPageShellProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-black text-zinc-100">
      <PublicCompactHeader isLoggedIn={isLoggedIn} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
