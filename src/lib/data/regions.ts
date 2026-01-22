"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

export const listRegions = async () => {
  const next = {
    ...(await getCacheOptions("regions")),
  }

  return sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ regions }) => regions)
    .catch(medusaError)
}

export const retrieveRegion = async (id: string) => {
  const next = {
    ...(await getCacheOptions(["regions", id].join("-"))),
  }

  return sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ region }) => region)
    .catch(medusaError)
}

// ... imports

const regionMap = new Map<string, HttpTypes.StoreRegion>()

export const getRegion = async (countryCode: string) => {
  try {
    // 1. Check strict cache first
    if (regionMap.has(countryCode)) {
      return regionMap.get(countryCode)
    }

    // 2. Fetch if missing
    const regions = await listRegions()

    if (!regions) {
      return null
    }

    // 3. Populate Map
    regionMap.clear() // Clear to ensure fresh data
    regions.forEach((region) => {
      region.countries?.forEach((c) => {
        regionMap.set(c?.iso_2 ?? "", region)
      })
    })

    // 4. Resolve Region
    // Priority A: Exact match (e.g., "in" -> India Region)
    let region = regionMap.get(countryCode)

    // Priority B: Fallback to "All" (Rest of World)
    // If exact match fails, we look for the region containing "us" (your "All" region)
    if (!region) {
      region = regionMap.get("us")
    }
    
    // Priority C: Fallback to first available region (Safety net)
    if (!region && regions.length > 0) {
        region = regions[0]
    }

    return region
  } catch (e: any) {
    return null
  }
}
