// src/lib/payment-handlers.ts
import { load } from '@cashfreepayments/cashfree-js'

// --- CASHFREE LOGIC ---
let cashfree: any = null

export const handleCashfree = async (sessionData: any) => {
  if (!cashfree) {
    cashfree = await load({ mode: "sandbox" }) // Change to "production" for live
  }

  const checkoutOptions = {
    // UPDATED: Backend sends 'payment_session_id', not 'id'
    paymentSessionId: sessionData.payment_session_id, 
    redirectTarget: "_self",
    returnUrl: `${window.location.origin}/order/confirmed`,
  }

  return cashfree.checkout(checkoutOptions)
}

// --- PAYTM LOGIC ---
export const handlePaytm = async (sessionData: any) => {
  const { mid, orderId, txnToken, amount } = sessionData

  if (!txnToken || !mid) {
    console.error("Paytm Error: Missing txnToken or MID", sessionData)
    alert("Payment initialization failed. Please try again.")
    return
  }

  // Helper to load Paytm Script dynamically
  const loadPaytmScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById("paytm-script")) {
        resolve(true)
        return
      }
      const script = document.createElement("script")
      script.id = "paytm-script"
      // Use STAGING URL for testing. 
      // For Production use: https://securegw.paytm.in/...
      script.src = `https://securegw-stage.paytm.in/merchantpgpui/checkoutjs/merchants/${mid}.js`
      script.onload = () => resolve(true)
      document.body.appendChild(script)
    })
  }

  await loadPaytmScript()

  const config = {
    root: "",
    flow: "DEFAULT",
    data: {
      orderId: orderId,
      token: txnToken,
      tokenType: "TXN_TOKEN",
      amount: amount,
    },
    handler: {
      transactionStatus: function (data: any) {
        console.log("Paytm Status: ", data)
        // If payment is successful, force redirect to success page
        if (data.STATUS === "TXN_SUCCESS") {
           // Medusa needs to verify this on the backend, 
           // usually via a callback/webhook, but for now we redirect.
          window.location.href = "/order/confirmed"
        } else {
          alert("Payment Failed: " + data.RESPMSG)
        }
      },
      notifyMerchant: function (eventName: string, data: any) {
        console.log("Paytm Event: ", eventName, data)
      },
    },
  }

  if ((window as any).Paytm && (window as any).Paytm.CheckoutJS) {
    (window as any).Paytm.CheckoutJS.init(config).then(function onSuccess() {
      (window as any).Paytm.CheckoutJS.invoke()
    })
  }
}