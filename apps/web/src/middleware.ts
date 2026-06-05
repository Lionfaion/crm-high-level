import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/contacts/:path*",
    "/pipelines/:path*",
    "/activities/:path*",
    "/notes/:path*",
    "/messaging/:path*",
    "/campaigns/:path*",
    "/funnels/:path*",
    "/calendar/:path*",
    "/reputation/:path*",
    "/reporting/:path*",
    "/memberships/:path*",
    "/payments/:path*",
    "/settings/:path*",
  ],
};
