"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId,
} from "./cookies"
import { getRegion } from "./regions"
import { getLocale } from "@lib/data/locale-actions"

/**
 * UPDATED: Added 'isFresh' parameter to bypass cache when needed
 */
export async function retrieveCart(cartId?: string, fields?: string, isFresh = false) {
  const id = cartId || (await getCartId())
  
  // Ensure we fetch payment sessions
  fields ??=
    "*items, *region, *items.product, *items.variant, *items.thumbnail, *items.metadata, +items.total, *promotions, +shipping_methods.name, +payment_collection.payment_sessions"

  if (!id) {
    return null
  }

  const headers = { ...(await getAuthHeaders()) }
  const next = { ...(await getCacheOptions("carts")) }

  return await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
      method: "GET",
      query: { fields },
      headers,
      next: isFresh ? undefined : next, // Disable next cache if fresh
      cache: isFresh ? "no-store" : "force-cache", // Force network request if fresh
    })
    .then(({ cart }: { cart: HttpTypes.StoreCart }) => cart)
    .catch(() => null)
}

export async function getOrSetCart(countryCode: string) {
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  let cart = await retrieveCart(undefined, undefined, true) // Force fresh to be safe

  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!cart) {
    const locale = (await getLocale()) ?? "en"

    const cartResp = await sdk.store.cart.create(
      {
        region_id: region.id,
        locale,
      },
      {},
      headers
    )

    cart = cartResp.cart

    await setCartId(cart.id)

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  return cart
}

// ... createInstantCart (Updated to use isFresh) ...
export async function createInstantCart({
  variantId,
  quantity,
  countryCode,
}: {
  variantId: string
  quantity: number
  countryCode: string
}) {
  try {
    const region = await getRegion(countryCode)
    if (!region) throw new Error(`Region not found for: ${countryCode}`)

    const headers = { ...(await getAuthHeaders()) }
    const locale = (await getLocale()) ?? "en"

    const cartResp = await sdk.store.cart.create(
      { region_id: region.id, locale },
      {},
      headers
    )
    const cart = cartResp.cart

    await sdk.store.cart.createLineItem(
      cart.id,
      { variant_id: variantId, quantity },
      {},
      headers
    )

    // Return fresh cart
    return await retrieveCart(cart.id, undefined, true)
  } catch (error: any) {
    console.error("Error in createInstantCart:", error)
    throw new Error(error.message || "Failed to create instant cart")
  }
}

export async function updateCart(data: HttpTypes.StoreUpdateCart, customCartId?: string) {
  const cartId = customCartId || (await getCartId())
  if (!cartId) throw new Error("No existing cart found")

  const headers = { ...(await getAuthHeaders()) }

  return sdk.store.cart
    .update(cartId, data, {}, headers)
    .then(async ({ cart }: { cart: HttpTypes.StoreCart }) => {
      if (!customCartId) {
        const cartCacheTag = await getCacheTag("carts")
        revalidateTag(cartCacheTag)
      }
      return cart
    })
    .catch(medusaError)
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
}: {
  variantId: string
  quantity: number
  countryCode: string
}) {
  if (!variantId) throw new Error("Missing variant ID")
  const cart = await getOrSetCart(countryCode)
  if (!cart) throw new Error("Error retrieving cart")

  const headers = { ...(await getAuthHeaders()) }

  await sdk.store.cart.createLineItem(
    cart.id,
    { variant_id: variantId, quantity },
    {},
    headers
  )
  .then(async () => {
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  })
  .catch(medusaError)
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  const cartId = await getCartId()
  if (!cartId) throw new Error("Missing cart ID")
  const headers = { ...(await getAuthHeaders()) }

  await sdk.store.cart.updateLineItem(cartId, lineId, { quantity }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    })
    .catch(medusaError)
}

export async function deleteLineItem(lineId: string) {
  const cartId = await getCartId()
  if (!cartId) throw new Error("Missing cart ID")
  const headers = { ...(await getAuthHeaders()) }

  await sdk.store.cart.deleteLineItem(cartId, lineId, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    })
    .catch(medusaError)
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  const headers = { ...(await getAuthHeaders()) }

  return sdk.store.cart
    .addShippingMethod(cartId, { option_id: shippingMethodId }, {}, headers)
    .catch(medusaError)
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: HttpTypes.StoreInitializePaymentSession
) {
  const headers = { ...(await getAuthHeaders()) }

  return sdk.store.payment
    .initiatePaymentSession(cart, data, {}, headers)
    .catch(medusaError)
}

export async function applyPromotions(codes: string[], customCartId?: string) {
  const cartId = customCartId || (await getCartId())
  if (!cartId) throw new Error("No existing cart found")
  const headers = { ...(await getAuthHeaders()) }

  return sdk.store.cart
    .update(cartId, { promo_codes: codes }, {}, headers)
    .then(async () => {
       if (!customCartId) {
          const cartCacheTag = await getCacheTag("carts")
          revalidateTag(cartCacheTag)
       }
    })
    .catch(medusaError)
}

export async function submitPromotionForm(currentState: unknown, formData: FormData) {
  const code = formData.get("code") as string
  try {
    await applyPromotions([code])
  } catch (e: any) {
    return e.message
  }
}

export async function setAddresses(currentState: unknown, formData: FormData) {
    try {
        if (!formData) throw new Error("No form data found")
        const cartId = await getCartId()
        if (!cartId) throw new Error("No cart found")

        // ... (Keep your data mapping logic here) ...
        const data = {
            shipping_address: {
                first_name: formData.get("shipping_address.first_name"),
                last_name: formData.get("shipping_address.last_name"),
                address_1: formData.get("shipping_address.address_1"),
                company: formData.get("shipping_address.company"),
                postal_code: formData.get("shipping_address.postal_code"),
                city: formData.get("shipping_address.city"),
                country_code: formData.get("shipping_address.country_code"),
                province: formData.get("shipping_address.province"),
                phone: formData.get("shipping_address.phone"),
            },
            email: formData.get("email"),
        } as any

        const sameAsBilling = formData.get("same_as_billing")
        if (sameAsBilling === "on") data.billing_address = data.shipping_address
        else {
             data.billing_address = {
                first_name: formData.get("billing_address.first_name"),
                last_name: formData.get("billing_address.last_name"),
                address_1: formData.get("billing_address.address_1"),
                company: formData.get("billing_address.company"),
                postal_code: formData.get("billing_address.postal_code"),
                city: formData.get("billing_address.city"),
                country_code: formData.get("billing_address.country_code"),
                province: formData.get("billing_address.province"),
                phone: formData.get("billing_address.phone"),
            }
        }

        await updateCart(data)
    } catch (e: any) {
        return e.message
    }
    redirect(`/${formData.get("shipping_address.country_code")}/checkout?step=delivery`)
}

export async function placeOrder(cartId?: string) {
  const id = cartId || (await getCartId())
  if (!id) throw new Error("No existing cart found")
  const headers = { ...(await getAuthHeaders()) }

  const cartRes = await sdk.store.cart.complete(id, {}, headers).catch(medusaError)

  if (cartRes?.type === "order") {
    const countryCode = cartRes.order.shipping_address?.country_code?.toLowerCase()
    const cookieCartId = await getCartId()
    if (cookieCartId === id) {
      removeCartId()
    }
    redirect(`/${countryCode}/order/${cartRes?.order.id}/confirmed`)
  }

  return cartRes.cart
}

export async function updateRegion(countryCode: string, currentPath: string) {
    const cartId = await getCartId()
    const region = await getRegion(countryCode)
    if (!region) throw new Error(`Region not found: ${countryCode}`)
    if (cartId) {
        await updateCart({ region_id: region.id })
        revalidateTag(await getCacheTag("carts"))
    }
    revalidateTag(await getCacheTag("regions"))
    revalidateTag(await getCacheTag("products"))
    redirect(`/${countryCode}${currentPath}`)
}

export async function listCartOptions(customCartId?: string) {
  const cartId = customCartId || (await getCartId())
  const headers = { ...(await getAuthHeaders()) }
  const next = { ...(await getCacheOptions("shippingOptions")) }

  return await sdk.client.fetch<{
    shipping_options: HttpTypes.StoreCartShippingOption[]
  }>("/store/shipping-options", {
    query: { cart_id: cartId },
    next,
    headers,
    cache: "force-cache",
  })
}