import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "dustin@givenest.com,kyndall@givenest.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

const protectedPaths = ["/charity/dashboard", "/admin", "/landlord/dashboard"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login pages through without auth.
  if (
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/landlord/login")
  ) {
    return NextResponse.next();
  }

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    return NextResponse.next();
  }

  // Use @supabase/ssr so the server-side reads the chunked `sb-*-auth-token`
  // cookies that the browser client writes (value is `base64-<session>`, not
  // a raw JWT — any manual Bearer-header approach will fail to parse it).
  //
  // `response` is rebuilt inside `setAll` because `@supabase/ssr` may need to
  // refresh+rewrite cookies on each request.
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Route unauth visitors to the login that matches the area they tried
    // to enter — landlords go to /landlord/login, everyone else to /admin/login.
    // Both forms post to the same Supabase signInWithPassword flow, but the
    // landing pages are styled and copy-tuned for their audience.
    const loginPath = pathname.startsWith("/landlord")
      ? "/landlord/login"
      : "/admin/login";
    const loginUrl = new URL(loginPath, req.url);
    loginUrl.searchParams.set("redirect_url", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes additionally require an ADMIN_EMAILS match.
  if (pathname.startsWith("/admin")) {
    const email = user.email?.toLowerCase();
    if (!email || !ADMIN_EMAILS.includes(email)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
  // Landlord-role binding is enforced server-side via `requireLandlord()` in
  // each /landlord/dashboard page/handler — middleware can't run pg.Pool
  // queries (Edge runtime). Middleware only ensures the visitor is logged in.

  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
