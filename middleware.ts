import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

// In-memory sliding window rate limiter
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup stale rate limit records periodically
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((value, key) => {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  });
}, 60000);

// Known hostile scrapers, vulnerability scanners, and automated tools
const BLOCKED_BOT_SIGNATURES = [
  "sqlmap",
  "nikto",
  "acunetix",
  "masscan",
  "censys",
  "semrushbot",
  "dirbuster",
  "nmap",
  "zgrab",
  "gobuster",
  "wpscan",
  "petalbot",
  "bytespider",
  "mj12bot",
  "ahrefsbot",
  "dotbot",
  "exabot",
  "whatweb",
  "havij",
];

function getClientIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "127.0.0.1"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
  const clientIp = getClientIp(request);

  // 1. Block Malicious Vulnerability Scanners and Aggressive Bots
  if (BLOCKED_BOT_SIGNATURES.some((sig) => userAgent.includes(sig))) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: "Access Denied: Automated bot or scanner signature detected.",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 2. Block Empty User-Agent requests hitting API endpoints
  if (pathname.startsWith("/api/") && !userAgent.trim()) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: "Access Denied: Requests without a valid User-Agent are disallowed.",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 3. Rate Limiting for Sensitive API Endpoints (e.g. /api/auth, /api/payments)
  const isAuthEndpoint = pathname.startsWith("/api/auth");
  const isApiEndpoint = pathname.startsWith("/api/");

  if (isApiEndpoint) {
    const limit = isAuthEndpoint ? 15 : 60; // Max 15 attempts/min on auth, 60/min on general API
    const windowMs = 60 * 1000;
    const key = `${clientIp}:${isAuthEndpoint ? "auth" : "api"}`;
    const now = Date.now();

    const record = rateLimitMap.get(key);

    if (!record || now > record.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      record.count += 1;
      if (record.count > limit) {
        const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: "Too Many Requests: Rate limit exceeded. Please wait before retrying.",
            retryAfter: retryAfterSeconds,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(retryAfterSeconds),
            },
          }
        );
      }
    }
  }

  // 4. Pass request through Supabase Session & Cookie Management
  const response = await createClient(request);

  // 5. Inject Security & Defense Headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
