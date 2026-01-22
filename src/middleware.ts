// src/middleware.ts
import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

// 1. HARDCODE THIS TEMPORARILY if your env var isn't loading, or ensure .env.local is correct.
// This ensures that visiting /booking automatically means /in/booking
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) throw new Error("Missing MEDUSA_BACKEND_URL")

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    const { regions } = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
      },
      next: {
        revalidate: 3600,
        tags: [`regions-${cacheId}`],
      },
    }).then((res) => res.json())

    if (!regions?.length) throw new Error("No regions found")

    regionMapCache.regionMap.clear()
    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

/**
 * Determines the country code.
 * PRIORITIZES DEFAULT REGION if no specific country is found.
 */
async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion>
) {
  try {
    // 1. Check if URL already has a country code (e.g. /in/booking)
    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()
    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      return urlCountryCode
    }

    // 2. FORCE Default Region for clean URLs
    // If the user visits /booking, we return "in"
    if (regionMap.has(DEFAULT_REGION)) {
      return DEFAULT_REGION
    }

    // 3. Fallback
    return regionMap.keys().next().value
  } catch (error) {
    return DEFAULT_REGION
  }
}

// ... getRegionMap and getCountryCode functions (keep as is)

export async function middleware(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const pathname = request.nextUrl.pathname

  if (pathname.includes(".") || pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  const cacheId = request.cookies.get("_medusa_cache_id")?.value || crypto.randomUUID()
  const regionMap = await getRegionMap(cacheId)
  const countryCode = await getCountryCode(request, regionMap)

  // --- FIX: Use strict equality (===) instead of .includes() ---
  // "booking".includes("in") is true, which caused the bug.
  // "booking" === "in" is false, which is correct.
  const urlHasCountryCode = countryCode && pathname.split("/")[1] === countryCode

  // A. If the URL is ALREADY explicit (e.g. /in/booking), just let it pass.
  if (urlHasCountryCode) {
    return NextResponse.next()
  }

  // B. REWRITE LOGIC
  if (countryCode) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-country-code", countryCode)

    const response = NextResponse.rewrite(
      new URL(`/${countryCode}${pathname}${request.nextUrl.search}`, request.url),
      {
        request: {
          headers: requestHeaders,
        },
      }
    )
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}