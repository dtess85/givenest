import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isCharityDashboard = createRouteMatcher(["/charity/dashboard(.*)"]);
const isAdmin = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isCharityDashboard(req) || isAdmin(req)) {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      const loginUrl = new URL("/charity/login", req.url);
      loginUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(loginUrl);
    }

    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (isAdmin(req) && role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (isCharityDashboard(req) && role !== "charity" && role !== "admin") {
      return NextResponse.redirect(new URL("/charity/login", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
