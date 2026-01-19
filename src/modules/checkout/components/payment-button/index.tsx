"use client"

import { isManual, isStripeLike } from "@lib/constants"
import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useState } from "react"
import ErrorMessage from "../error-message"
import { handlePaytm } from "@lib/payment-handlers" 
import { CashfreePaymentButton } from "./cashfree-payment-button" 
import { RazorpayPaymentButton } from "./razorpay-payment-button"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email
    //  ||
    // (cart.shipping_methods?.length ?? 0) < 1

  // 1. FIX: Find the session that is actually PENDING.
  // If we just take [0], we might get an old abandoned session.
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  // Fallback: If no pending session is marked (rare), take the first one, or undefined
  const paymentSession = activeSession || cart.payment_collection?.payment_sessions?.[0]
  const providerId = paymentSession?.provider_id

  // Debugging: This will show you exactly what ID is being selected in your browser console
  console.log("PaymentButton: Selected Provider ID:", providerId)

  switch (true) {
    case isStripeLike(providerId):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isManual(providerId):
      return (
        <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} cart={cart}/>
      )

    // --- CASE: CASHFREE ---
    // Checks for both standard ID and Medusa's "pp_" prefix format
    case providerId === "cashfree" || providerId === "pp_cashfree_cashfree":
      return (
        <CashfreePaymentButton 
          session={paymentSession} 
          cart={cart} 
        />
      )

    // --- CASE: RAZORPAY ---
    // Checks for both standard ID and Medusa's "pp_" prefix format
    case providerId === "razorpay" || providerId === "pp_razorpay_razorpay":
      return (
        <RazorpayPaymentButton 
          session={paymentSession!} 
          cart={cart}
        />
      )

    // --- CASE: PAYTM ---
    case providerId === "paytm" || providerId === "pp_paytm_paytm":
      return (
        <GeneralPaymentButton
          cart={cart}
          notReady={notReady}
          data-testid={dataTestId}
        />
      )

    default:
      return <Button disabled>Select a payment method</Button>
  }
}

// --- PAYTM / GENERIC BUTTON ---
const GeneralPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const paymentSession = cart.payment_collection?.payment_sessions?.find(
     (s) => s.status === "pending"
  )

  const handlePayment = async () => {
    if (!paymentSession) return

    setSubmitting(true)
    setErrorMessage(null)

    try {
      if (paymentSession.provider_id.includes("paytm")) {
        await handlePaytm(paymentSession.data)
      } else {
        throw new Error("Unknown payment provider: " + paymentSession.provider_id)
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred")
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="general-payment-error-message"
      />
    </>
  )
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    setSubmitting(true)

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    await stripe
      .confirmCardPayment(session?.data.client_secret as string, {
        payment_method: {
          card: card,
          billing_details: {
            name:
              cart.billing_address?.first_name +
              " " +
              cart.billing_address?.last_name,
            address: {
              city: cart.billing_address?.city ?? undefined,
              country: cart.billing_address?.country_code ?? undefined,
              line1: cart.billing_address?.address_1 ?? undefined,
              line2: cart.billing_address?.address_2 ?? undefined,
              postal_code: cart.billing_address?.postal_code ?? undefined,
              state: cart.billing_address?.province ?? undefined,
            },
            email: cart.email,
            phone: cart.billing_address?.phone ?? undefined,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent

          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            onPaymentCompleted()
          }

          setErrorMessage(error.message || null)
          return
        }

        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          paymentIntent.status === "succeeded"
        ) {
          return onPaymentCompleted()
        }

        return
      })
  }

  return (
    <>
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

// src/modules/checkout/components/payment-button/index.tsx

// ... existing imports ...

// REPLACE THE COMPONENT AT THE BOTTOM WITH THIS:
// src/modules/checkout/components/payment-button/index.tsx

const ManualTestPaymentButton = ({ 
  notReady,
  cart 
}: { 
  notReady: boolean
  cart: HttpTypes.StoreCart 
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    // FIX: Pass cart.id explicitly. 
    // This tells the server exactly which cart to complete, ignoring missing cookies.
    await placeOrder(cart.id) 
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    try {
      // 1. Find the Manual/System session
      const manualSession = cart.payment_collection?.payment_sessions?.find(
        (s) => s.provider_id === "manual" || s.provider_id.includes("system")
      ) || cart.payment_sessions?.find(
        (s) => s.provider_id === "manual" || s.provider_id.includes("system")
      )

      if (manualSession) {
        // 2. Activate the session to fix "Payment sessions are required"
        const { initiatePaymentSession } = await import("@lib/data/cart")
        
        await initiatePaymentSession(cart, {
          provider_id: manualSession.provider_id
        })
      }

      // 3. Place order (now with explicit ID)
      await onPaymentCompleted()
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process manual payment")
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid="submit-order-button"
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}
export default PaymentButton