import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "dustin@givenest.com,kyndall@givenest.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

const protectedPaths = ["/charity/dashboard", "/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page through without auth
  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for Supabase auth token in cookies
  const accessToken = req.cookies.get("sb-access-token")?.value
    ?? req.cookies.getAll().find((c) => c.name.endsWith("-auth-token"))?.value;

  if (!accessToken) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("redirect_url", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify the token with Supabase
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("redirect_url", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin routes require admin email
    if (pathname.startsWith("/admin")) {
      const email = user.email?.toLowerCase();
      if (!email || !ADMIN_EMAILS.includes(email)) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  } catch {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("redirect_url", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
