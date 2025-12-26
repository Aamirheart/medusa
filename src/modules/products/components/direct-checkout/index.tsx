"use client"

import { useState, useEffect } from "react"
import { Button, Input, Heading, Text } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { 
  addToCart, 
  updateCart, 
  setShippingMethod, 
  initiatePaymentSession, 
  listCartOptions,
  applyPromotions,
  retrieveCart 
} from "@lib/data/cart"
import { CashfreePaymentButton } from "@modules/checkout/components/payment-button/cashfree-payment-button"
import { formatAmount } from "@lib/util/money"
import Spinner from "@modules/common/icons/spinner"

type DirectCheckoutProps = {
  product: HttpTypes.StoreProduct
  variant: HttpTypes.StoreProductVariant
  countryCode: string
  region: HttpTypes.StoreRegion
  close: () => void
}

export default function DirectCheckout({ 
  product, 
  variant, 
  countryCode,
  region,
  close 
}: DirectCheckoutProps) {
  // State management
  const [step, setStep] = useState<"address" | "payment">("address")
  const [loading, setLoading] = useState(false)
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(null)
  const [couponCode, setCouponCode] = useState("")
  
  // Form Data
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

  // 1. Initialize: Add item to cart
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        await addToCart({
          variantId: variant.id,
          quantity: 1,
          countryCode
        })
        const cartRes = await retrieveCart()
        setCart(cartRes)
      } catch (e) {
        console.error("Init Error:", e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [variant.id, countryCode])

  // 2. Handle Address Submission (UPDATED WITH DEBUGGING)
  const handleAddressSubmit = async () => {
    setLoading(true)
    try {
      if (!cart) throw new Error("Cart not initialized")

      console.log("1. Updating Address...", { email, address, countryCode })
      
      // Step A: Update Address
      await updateCart({
        email,
        shipping_address: { ...address, country_code: countryCode },
        billing_address: { ...address, country_code: countryCode }
      })

      // Step B: Fetch Shipping Options
      console.log("2. Fetching Shipping Options...")
      const result = await listCartOptions()
      const options = result.shipping_options || []

      console.log("Shipping Options Found:", options)

      if (options.length === 0) {
        throw new Error("No Shipping Options found for this address. Go to Medusa Admin -> Settings -> Regions and add a Shipping Option.")
      }

      // Step C: Select the first shipping option
      console.log("3. Selecting Shipping Method:", options[0].id)
      await setShippingMethod({ 
        cartId: cart.id, 
        shippingMethodId: options[0].id 
      })

      // Step D: Initialize Payment Session
      console.log("4. Initializing Payment Session (Cashfree)...")
      await initiatePaymentSession(cart, { provider_id: "cashfree" })
      
      // Step E: Refresh Cart
      const updatedCart = await retrieveCart()
      setCart(updatedCart)
      setStep("payment")

    } catch (e: any) {
      console.error("❌ Checkout Error:", e)
      // Show the REAL error message from the backend
      alert(`Checkout Failed: ${e.message || "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  // 3. Handle Coupon Application
  const handleApplyCoupon = async () => {
    if (!couponCode) return
    setLoading(true)
    try {
      await applyPromotions([couponCode])
      const updatedCart = await retrieveCart()
      setCart(updatedCart)
      setCouponCode("") 
    } catch (e) {
      alert("Invalid Coupon Code")
    } finally {
      setLoading(false)
    }
  }

  const getCashfreeSession = () => {
    return cart?.payment_sessions?.find(s => s.provider_id === "cashfree")
  }

  if (!cart && loading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><Spinner /></div>

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white p-6 w-full max-w-lg rounded-lg shadow-xl max-h-[90vh] overflow-y-auto relative">
        <button onClick={close} className="absolute top-4 right-4 text-gray-500 hover:text-black font-bold text-xl">✕</button>
        
        <Heading className="mb-4 text-xl font-bold">
          {step === "address" ? "Shipping Details" : "Secure Payment"}
        </Heading>

        {/* --- STEP 1: ADDRESS FORM --- */}
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
            
            <Button 
              onClick={handleAddressSubmit} 
              isLoading={loading}
              className="mt-4 w-full"
            >
              Continue to Payment
            </Button>
          </div>
        )}

        {/* --- STEP 2: PAYMENT & SUMMARY --- */}
        {step === "payment" && cart && (
          <div className="flex flex-col gap-4">
            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-md text-sm border">
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-900">{product.title}</span>
                <span>{formatAmount({ amount: variant.calculated_price?.calculated_amount || 0, region, includeTaxes: false })}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span>{formatAmount({ amount: cart.shipping_total || 0, region, includeTaxes: false })}</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-2 border-t pt-2 text-gray-900">
                <span>Total</span>
                <span>{formatAmount({ amount: cart.total || 0, region, includeTaxes: true })}</span>
              </div>
            </div>

            {/* Coupon Code Section */}
            <div className="flex gap-2">
              <Input 
                placeholder="Discount Code" 
                value={couponCode} 
                onChange={(e) => setCouponCode(e.target.value)} 
              />
              <Button variant="secondary" onClick={handleApplyCoupon} isLoading={loading}>
                Apply
              </Button>
            </div>
            
            {/* Display Applied Promotions */}
            {cart.promotions && cart.promotions.length > 0 && (
               <div className="text-green-600 text-sm font-medium bg-green-50 p-2 rounded">
                 Coupon applied: {cart.promotions[0].code}
               </div>
            )}

            {/* Cashfree Payment Button */}
            {getCashfreeSession() ? (
              <CashfreePaymentButton session={{ data: getCashfreeSession()?.data }} cart={cart} />
            ) : (
              <Text className="text-red-500 font-medium text-center">
                Payment session not initialized. Please go back.
              </Text>
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