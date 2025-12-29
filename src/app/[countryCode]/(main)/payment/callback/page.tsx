///(main)/payment/callback/page.tsx]
"use client"

import { useEffect, useRef, useState, Suspense } from "react"
import { placeOrder } from "@lib/data/cart"
import { Heading, Text, Button } from "@medusajs/ui"
import Spinner from "@modules/common/icons/spinner"
import { useRouter, useSearchParams } from "next/navigation"

function CallbackContent() {
  const [status, setStatus] = useState<"processing" | "error">("processing")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const processed = useRef(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const cartId = searchParams.get("cart_id")
  const cfStatus = searchParams.get("txStatus") || searchParams.get("order_status")

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    if (!cartId) {
      setStatus("error")
      setErrorMessage("No Cart ID found.")
      return
    }

    if (cfStatus && (cfStatus === "FAILED" || cfStatus === "CANCELLED")) {
      setStatus("error")
      setErrorMessage("Payment failed or was cancelled.")
      return
    }

    const finalizeOrder = async (retries = 3) => {
      try {
        console.log(`Verifying payment... (${retries} retries left)`)
        
        // This will now take ~3-4 seconds due to backend polling
        await placeOrder(cartId)
        
      } catch (err: any) {
        console.error("Verification failed:", err.message)

        if (retries > 0) {
          // If backend polling didn't catch it, wait 2s more and retry frontend
          setTimeout(() => finalizeOrder(retries - 1), 2000)
        } else {
          setStatus("error")
          setErrorMessage("We could not verify your payment yet. It might still be processing.")
        }
      }
    }

    finalizeOrder()
  }, [cartId, cfStatus])

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-4 text-center">
        <Heading level="h2" className="text-red-600">Verification Incomplete</Heading>
        <Text className="max-w-md text-gray-600">{errorMessage}</Text>
        <div className="flex gap-2">
           <Button onClick={() => window.location.reload()}>Check Again</Button>
           <Button variant="secondary" onClick={() => router.push("/cart")}>Back to Cart</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Spinner className="animate-spin w-10 h-10 text-blue-600" />
      <Heading level="h2">Confirming Payment</Heading>
      <Text className="text-gray-500">Communicating with bank...</Text>
    </div>
  )
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-10"><Spinner /></div>}>
      <CallbackContent />
    </Suspense>
  )
}