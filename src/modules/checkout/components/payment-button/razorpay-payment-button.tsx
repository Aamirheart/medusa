"use client"

import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import React, { useState, useEffect } from "react"
import ErrorMessage from "../error-message"

type RazorpayPaymentButtonProps = {
  session: HttpTypes.StorePaymentSession
  cart: HttpTypes.StoreCart
  "data-testid"?: string
}

export const RazorpayPaymentButton = ({
  session,
  cart,
  "data-testid": dataTestId,
}: RazorpayPaymentButtonProps) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSdkLoaded, setIsSdkLoaded] = useState(false)

  // 1. Load Razorpay SDK script
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => setIsSdkLoaded(true)
    script.onerror = () => setErrorMessage("Failed to load Razorpay SDK")
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // 2. Handle Order Placement
  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  // 3. Trigger Payment Modal
  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    if (!isSdkLoaded || !(window as any).Razorpay) {
      setErrorMessage("Razorpay SDK not loaded yet. Please try again.")
      setSubmitting(false)
      return
    }

    try {
      // The backend should typically provide the Razorpay Order ID in session.data.id
      // or similar, depending on your specific plugin implementation.
      const razorpayOrderId = session.data?.id as string | undefined

      if (!razorpayOrderId) {
        throw new Error("No Razorpay Order ID found in session data")
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY ?? "", // Add this to your .env
        amount: session.amount, // Amount in smallest currency unit (e.g., paise)
        currency: cart.currency_code.toUpperCase(),
        name: "Your Store Name",
        description: `Order #${cart.id.slice(0, 7)}`,
        order_id: razorpayOrderId,
        
        // Handler triggered on successful payment
        handler: async function (response: any) {
          // You can access response.razorpay_payment_id, etc. here if needed
          // Standard Medusa flow: Complete the cart now that payment is authorized
          await onPaymentCompleted()
        },
        
        prefill: {
          name: `${cart.shipping_address?.first_name} ${cart.shipping_address?.last_name}`,
          email: cart.email,
          contact: cart.shipping_address?.phone ?? undefined,
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false)
          },
        },
      }

      const razorpay = new (window as any).Razorpay(options)
      razorpay.open()
      
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred initiating Razorpay")
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={!isSdkLoaded || submitting}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid={dataTestId}
      >
        Pay with Razorpay
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="razorpay-payment-error-message"
      />
    </>
  )
}