import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth",
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/swing-analysis/:path*", "/mental-game/:path*", "/settings/:path*", "/profile/:path*"],
};
