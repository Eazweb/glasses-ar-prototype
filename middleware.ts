import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Get allowed origins from environment variable, split by comma
  // Example: ALLOWED_ORIGINS=https://website-e.com,https://another-site.com
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") ?? [];

  // In development, allow the default Next.js port for local testing.
  if (process.env.NODE_ENV === "development") {
    allowedOrigins.push("http://localhost:3000");
    // If your parent app runs on a different port locally, add it here too.
    // e.g., allowedOrigins.push('http://localhost:3001');
  }

  // If there are any allowed origins, construct the CSP header.
  if (allowedOrigins.length > 0) {
    const cspHeader = `frame-ancestors ${allowedOrigins.join(" ")}`;
    response.headers.set("Content-Security-Policy", cspHeader);
  }

  return response;
}

// This middleware will run on all paths.
export const config = {
  matcher: "/:path*",
};
