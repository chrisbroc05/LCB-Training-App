import PublicSiteHeader from "@/app/PublicSiteHeader";

type PublicPageShellProps = {
  children: React.ReactNode;
  isLoggedIn?: boolean;
  showArticlesNav?: boolean;
};

export default function PublicPageShell({
  children,
  isLoggedIn = false,
  showArticlesNav = false,
}: PublicPageShellProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-black text-zinc-100">
      <div className="site-sticky-header-shell">
        <PublicSiteHeader isLoggedIn={isLoggedIn} showArticlesNav={showArticlesNav} />
      </div>
      <main className="flex-1">{children}</main>
    </div>
  );
}
