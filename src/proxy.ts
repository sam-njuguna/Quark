import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";

const blockedIPs = new Map<string, { until: number; reason: string }>();
const suspiciousRequests = new Map<string, number[]>();

function getIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isIPBlocked(ip: string): boolean {
  const block = blockedIPs.get(ip);
  if (!block) return false;

  if (Date.now() > block.until) {
    blockedIPs.delete(ip);
    return false;
  }
  return true;
}

function trackSuspiciousRequest(ip: string): void {
  const now = Date.now();
  const requests = suspiciousRequests.get(ip) || [];

  // Keep only requests from last 60 seconds
  const recentRequests = requests.filter((time) => now - time < 60000);
  recentRequests.push(now);
  suspiciousRequests.set(ip, recentRequests);

  // Block if more than 100 requests in 60 seconds
  if (recentRequests.length > 100) {
    blockedIPs.set(ip, {
      until: now + 3600000, // 1 hour
      reason: "Too many requests",
    });
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getIP(request);

  // Check if IP is blocked
  if (isIPBlocked(ip)) {
    return new NextResponse("Access Denied", { status: 403 });
  }

  // Track request for rate limiting
  trackSuspiciousRequest(ip);

  const protectedRoutes = ["/dashboard"];
  const authRoutes = ["/login", "/accept-invitation"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (pathname === "/" && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Prevent caching + add security headers
  const response = NextResponse.next();
  if (isProtectedRoute || isAuthRoute) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).+)",
  ],
};
