//
import { load } from '@cashfreepayments/cashfree-js';
import { Button } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"

type CashfreeButtonProps = {
  session: any
  cart: HttpTypes.StoreCart
}

export const CashfreePaymentButton = ({ session, cart }: CashfreeButtonProps) => {
  const [loading, setLoading] = useState(false)
  const [cashfree, setCashfree] = useState<any>(null)

  useEffect(() => {
    const initCashfree = async () => {
      try {
        const cashfreeInstance = await load({
          mode: "sandbox" // Change to "production" in live env
        });
        setCashfree(cashfreeInstance);
      } catch (err) {
        console.error("Failed to initialize Cashfree SDK", err);
      }
    };
    initCashfree();
  }, []);

  const handlePayment = async () => {
    setLoading(true)

    if (!cashfree) {
      alert("Payment SDK failed to load. Please refresh the page.");
      setLoading(false);
      return;
    }

    try {
      if (session.data.error) {
        alert(`Backend Error: ${session.data.error}`);
        setLoading(false);
        return;
      }

      const paymentSessionId = session.data.payment_session_id 

      if (!paymentSessionId) {
        alert("Error: No Session ID found.")
        setLoading(false)
        return
      }

      const countryCode = cart.shipping_address?.country_code?.toLowerCase() || "in"

      // UPDATED: Pass cart_id in the URL
      const returnUrl = `${window.location.origin}/${countryCode}/payment/callback?cart_id=${cart.id}`

      cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: "_self",
        returnUrl: returnUrl 
      })
      
    } catch (error: any) {
      console.error("Cashfree Error:", error)
      alert(error.message)
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handlePayment} 
      isLoading={loading}
      className="w-full mt-4"
      size="large"
      disabled={!cashfree} 
    >
      Pay with Cashfree
    </Button>
  )
}