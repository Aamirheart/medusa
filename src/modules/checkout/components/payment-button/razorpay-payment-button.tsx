// src/modules/checkout/components/payment-button/razorpay-payment-button.tsx

"use client"

import { Button, Text } from "@medusajs/ui"
import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { placeOrder } from "@lib/data/cart"
// 1. FIXED: Use named import for useRazorpay
import { useRazorpay, RazorpayOrderOptions } from "react-razorpay" 

type RazorpayButtonProps = {
  session: HttpTypes.StorePaymentSession
  cart: HttpTypes.StoreCart
}

export const RazorpayPaymentButton = ({ session, cart }: RazorpayButtonProps) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { error, isLoading, Razorpay } = useRazorpay()

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    try {
      if (isLoading || !Razorpay) {
        throw new Error("Razorpay SDK is still loading. Please try again.")
      }

      const razorpayOrderId = (session.data as any)?.id

      if (!razorpayOrderId) {
        throw new Error("Razorpay Order ID missing from session data.")
      }

      const options: RazorpayOrderOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || "", 
        amount: session.amount, 
        currency: cart.currency_code.toUpperCase(),
        name: "My Medusa Store",
        description: `Order #${cart.display_id}`,
        order_id: razorpayOrderId,
        
        handler: async (response) => {
          await placeOrder()
            .catch((err) => {
              setErrorMessage(err.message)
            })
            .finally(() => {
              setSubmitting(false)
            })
        },
        prefill: {
          name: cart.shipping_address?.first_name + " " + cart.shipping_address?.last_name,
          email: cart.email,
          contact: cart.shipping_address?.phone || undefined,
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

      const razorpayInstance = new Razorpay(options)
      razorpayInstance.open()
      
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong")
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button 
        onClick={handlePayment} 
        isLoading={submitting || isLoading}
        className="w-full mt-4"
        size="large"
        disabled={submitting || isLoading || !!error}
      >
        {isLoading ? "Loading Razorpay..." : "Pay with Razorpay"}
      </Button>
      
      {errorMessage && (
        <Text className="text-red-500 text-small-regular mt-2">
          {errorMessage}
        </Text>
      )}
    </div>
  )
}