"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

export type Locale = {
  code: string
  name: string
}

export const listLocales = async (): Promise<Locale[] | null> => {
  const next = {
    ...(await getCacheOptions("locales")),
  }

  try {
    const res = await sdk.client.fetch(`/store/locales`, {
      method: "GET",
      next,
      cache: "force-cache",
    })

    return (res as { locales: Locale[] }).locales
  } catch (error: any) {
    // Medusa SDK throws FetchError / Response
    if (error?.status === 404 || error?.cause?.status === 404) {
      return null
    }

    // Log only unexpected errors
    console.error("Failed to fetch locales:", error)
    return null
  }
}
