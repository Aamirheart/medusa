"use client"

import { useState, useEffect } from "react"
import { Button, Input, Heading, Text, clx } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { 
  createInstantCart, 
  updateCart, 
  setShippingMethod, 
  initiatePaymentSession, 
  listCartOptions,
  retrieveCart,
  applyPromotions
} from "@lib/data/cart"
import { CashfreePaymentButton } from "@modules/checkout/components/payment-button/cashfree-payment-button"
import { formatAmount } from "@lib/util/money"
import Spinner from "@modules/common/icons/spinner"

// Helper type to ensure we can access payment_collection
type EnhancedCart = HttpTypes.StoreCart & {
  payment_collection?: {
    payment_sessions?: HttpTypes.StorePaymentSession[]
  }
}

type DirectCheckoutProps = {
  product: HttpTypes.StoreProduct
  variant: HttpTypes.StoreProductVariant
  countryCode: string
  region: HttpTypes.StoreRegion
  close: () => void
  metadata?: Record<string, any>
}

export default function DirectCheckout({ 
  product, 
  variant, 
  countryCode,
  region,
  close,
  metadata 
}: DirectCheckoutProps) {
  const [step, setStep] = useState<"address" | "payment">("address")
  const [loading, setLoading] = useState(false)
  const [couponLoading, setCouponLoading] = useState(false)
  const [instantCartId, setInstantCartId] = useState<string | null>(null)
  const [cart, setCart] = useState<EnhancedCart | null>(null)
  
  // Coupon State
  const [couponCode, setCouponCode] = useState("")
  const [couponMessage, setCouponMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

  const [email, setEmail] = useState("")
  const [address, setAddress] = useState({
    first_name: "",
    last_name: "",
    address_1: "",
    city: "",
    postal_code: "",
    phone: "",
    country_code: countryCode,
  })

  // 1. Initialize "Ghost Cart"
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const newCart = await createInstantCart({
          variantId: variant.id,
          quantity: 1,
          countryCode,
          metadata 
        })
        if (newCart) {
            setInstantCartId(newCart.id)
            setCart(newCart)
        }
      } catch (e) {
        console.error("Init Error:", e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [variant.id, countryCode, metadata])

  // 2. Handle Address & Move to Payment
  const handleAddressSubmit = async () => {
    setLoading(true)
    try {
      if (!instantCartId) throw new Error("Cart not initialized")

      // A. Update Address
      await updateCart({
        email,
        shipping_address: { ...address, country_code: countryCode },
        billing_address: { ...address, country_code: countryCode }
      }, instantCartId)

      // B. Shipping
      const result = await listCartOptions(instantCartId)
      const options = result.shipping_options || []
      if (options.length === 0) throw new Error("No Shipping Options found.")
      
      await setShippingMethod({ 
        cartId: instantCartId, 
        shippingMethodId: options[0].id 
      })

      // C. Get Fresh Cart & Init Payment
      const freshCart = await retrieveCart(instantCartId, undefined, true)

      if (freshCart) {
          console.log("💰 Init Payment for:", freshCart.total)
          await initiatePaymentSession(freshCart, { provider_id: "pp_cashfree_cashfree" })
          
          // Refresh again to get payment sessions
          const finalCart = await retrieveCart(instantCartId, undefined, true)
          setCart(finalCart)
          setStep("payment")
      }
    } catch (e: any) {
      console.error("Checkout Error:", e)
      alert(`Checkout Failed: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 3. Handle Coupon Application (UPDATED with Auto-Recovery)
  const handleApplyCoupon = async () => {
    if (!couponCode || !instantCartId) return
    setCouponLoading(true)
    setCouponMessage(null)
    
    try {
      // A. Apply to the specific instantCartId
      await applyPromotions([couponCode], instantCartId)
      
      // B. Fetch updated cart 
      // NOTE: Medusa deletes the session when total changes
      let updatedCart = await retrieveCart(instantCartId, undefined, true) as EnhancedCart
      
      if (updatedCart) {
        // C. AUTO-RECOVERY: Check if session is lost
        const sessions = updatedCart.payment_collection?.payment_sessions || updatedCart.payment_sessions
        const hasSession = sessions?.some((s: any) => s.provider_id === "pp_cashfree_cashfree" || s.provider_id === "cashfree")

        if (!hasSession) {
             console.log("♻️ Coupon invalidated session. Re-initiating Cashfree...")
             
             // Re-initiate the session with the new price
             await initiatePaymentSession(updatedCart, { provider_id: "pp_cashfree_cashfree" })
             
             // D. Fetch again to get the NEW session
             updatedCart = await retrieveCart(instantCartId, undefined, true) as EnhancedCart
        }

        setCart(updatedCart)
        setCouponMessage({ text: "Coupon applied!", type: 'success' })
        setCouponCode("") // Clear input on success
      }
    } catch (e: any) {
      setCouponMessage({ text: e.message || "Invalid coupon code", type: 'error' })
    } finally {
      setCouponLoading(false)
    }
  }

  const getCashfreeSession = () => {
    if (!cart) return undefined
    let sessions = cart.payment_collection?.payment_sessions || cart.payment_sessions
    return sessions?.find((s: any) => s.provider_id === "pp_cashfree_cashfree" || s.provider_id === "cashfree")
  }

  if (!cart && loading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><Spinner /></div>

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white p-6 w-full max-w-lg rounded-lg shadow-xl max-h-[90vh] overflow-y-auto relative">
        <button onClick={close} className="absolute top-4 right-4 text-gray-500 hover:text-black font-bold text-xl">✕</button>
        
        <Heading className="mb-4 text-xl font-bold">
          {step === "address" ? "Shipping Details" : "Secure Payment"}
        </Heading>

        {/* --- STEP 1: ADDRESS --- */}
        {step === "address" && (
          <div className="flex flex-col gap-4">
             <div className="grid grid-cols-2 gap-4">
              <Input placeholder="First Name" value={address.first_name} onChange={(e) => setAddress({...address, first_name: e.target.value})} />
              <Input placeholder="Last Name" value={address.last_name} onChange={(e) => setAddress({...address, last_name: e.target.value})} />
            </div>
            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Address" value={address.address_1} onChange={(e) => setAddress({...address, address_1: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="City" value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} />
              <Input placeholder="Postal Code" value={address.postal_code} onChange={(e) => setAddress({...address, postal_code: e.target.value})} />
            </div>
            <Input placeholder="Phone" value={address.phone} onChange={(e) => setAddress({...address, phone: e.target.value})} />
            
            <Button onClick={handleAddressSubmit} isLoading={loading} className="mt-4 w-full">
              Continue to Payment
            </Button>
          </div>
        )}

        {/* --- STEP 2: PAYMENT & COUPON --- */}
        {step === "payment" && cart && (
          <div className="flex flex-col gap-4">
            
            {/* Summary Box */}
            <div className="bg-gray-50 p-4 rounded-md text-sm border">
               <div className="flex justify-between mb-1">
                 <span className="text-gray-600">Subtotal</span>
                 <span>{formatAmount({ amount: cart.subtotal || 0, region, includeTaxes: false })}</span>
               </div>
               <div className="flex justify-between mb-1">
                 <span className="text-gray-600">Shipping</span>
                 <span>{formatAmount({ amount: cart.shipping_total || 0, region, includeTaxes: false })}</span>
               </div>
               {cart.discount_total > 0 && (
                 <div className="flex justify-between mb-1 text-green-600">
                   <span>Discount</span>
                   <span>- {formatAmount({ amount: cart.discount_total || 0, region, includeTaxes: false })}</span>
                 </div>
               )}
               <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-gray-200 text-gray-900">
                <span>Total</span>
                <span>{formatAmount({ amount: cart.total || 0, region, includeTaxes: true })}</span>
              </div>
            </div>

            {/* Coupon Section */}
            <div>
              <Text className="text-small-regular text-gray-700 mb-2">Discount Code</Text>
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter code" 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value)} 
                />
                <Button 
                  variant="secondary" 
                  onClick={handleApplyCoupon} 
                  isLoading={couponLoading}
                  disabled={!couponCode}
                >
                  Apply
                </Button>
              </div>
              {couponMessage && (
                <Text className={clx("text-small-regular mt-2", {
                  "text-green-600": couponMessage.type === 'success',
                  "text-red-500": couponMessage.type === 'error'
                })}>
                  {couponMessage.text}
                </Text>
              )}
            </div>

            {/* Payment Button with Fallback */}
            {getCashfreeSession() ? (
              <CashfreePaymentButton session={{ data: getCashfreeSession()?.data }} cart={cart} />
            ) : (
              <div className="text-center">
                 <Text className="text-red-500 font-medium mb-2">
                   Payment session updated.
                 </Text>
                 <Button variant="secondary" onClick={handleApplyCoupon} size="small" isLoading={couponLoading}>
                    Reload Payment
                 </Button>
              </div>
            )}
            
            <button onClick={() => setStep("address")} className="text-sm text-gray-500 underline mt-2 text-center hover:text-gray-900">
              Edit Shipping Address
            </button>
          </div>
        )}
      </div>
    </div>
  )
}