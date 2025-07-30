// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session jika diperlukan
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  console.log("Middleware - Session:", session?.user?.email || "No session");
  console.log("Middleware - Path:", req.nextUrl.pathname);

  // Jika mencoba akses /admin tanpa session
  if (req.nextUrl.pathname.startsWith("/admin") && !session) {
    console.log("Redirecting to auth - no session");
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  // Jika sudah login dan mencoba akses /auth, redirect ke admin
  if (req.nextUrl.pathname.startsWith("/auth") && session) {
    console.log("Redirecting to admin - already logged in");
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/auth"],
};