// app/api/geo/route.js
//
// GET /api/geo
// Detects the visitor's country (and city/region when available) from the
// request. Used by the navbar region indicator.
//
// Detection order:
//   1. Edge/CDN geo headers (Vercel: x-vercel-ip-country, Cloudflare: cf-ipcountry)
//   2. geoip-lite lookup on the client IP (covers self-hosted / other hosts)
//   3. Fallback to GB (the business is UK-based) so the UI always has a value.
//
// Returns the country as an ISO-3166 alpha-2 code plus an English display
// name (via Intl.DisplayNames — no hand-maintained country map needed).

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    ""
  );
}

function displayCountry(code) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

function payload({ countryCode, city = null, region = null, detected }) {
  return NextResponse.json(
    {
      success: true,
      detected,
      countryCode,
      country: displayCountry(countryCode),
      city,
      region,
    },
    // Per-visitor cache: avoids re-detecting on every navigation, but never
    // shared between users by a CDN.
    { headers: { "Cache-Control": "private, max-age=3600" } }
  );
}

export async function GET(request) {
  // 1) CDN / edge geo headers (present on Vercel & Cloudflare in production)
  let countryCode =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    null;

  let city = request.headers.get("x-vercel-ip-city");
  if (city) { try { city = decodeURIComponent(city); } catch { /* keep raw */ } }
  let region = request.headers.get("x-vercel-ip-country-region") || null;

  if (countryCode && countryCode !== "XX") {
    return payload({ countryCode: countryCode.toUpperCase(), city, region, detected: true });
  }

  // 2) geoip-lite on the raw IP (skips loopback / private addresses)
  const ip = clientIp(request);
  const isLocal = !ip || ip === "::1" || ip.startsWith("127.") || ip.startsWith("10.") || ip.startsWith("192.168.");
  if (!isLocal) {
    try {
      const geoip = (await import("geoip-lite")).default;
      const geo = geoip.lookup(ip);
      if (geo?.country) {
        return payload({ countryCode: geo.country, city: geo.city || null, region: geo.region || null, detected: true });
      }
    } catch { /* dataset unavailable — fall through */ }
  }

  // 3) Fallback — UK-based business default
  return payload({ countryCode: "GB", detected: false });
}
