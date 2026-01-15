"use client"

import { useEffect, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { Button, Heading, Text, Input, Label, clx } from "@medusajs/ui"
import { formatCurrency } from "@lib/util/money"
import { 
  createInstantCart, 
  updateCart, 
  applyPromotions, 
  initiatePaymentSession, 
  retrieveCart 
} from "@lib/data/cart"
import { listCartPaymentMethods } from "@lib/data/payment"
import PaymentButton from "@modules/checkout/components/payment-button"
import { Spinner } from "@medusajs/icons"

type BookingCheckoutProps = {
  product: HttpTypes.StoreProduct
  variant: HttpTypes.StoreProductVariant
  region: HttpTypes.StoreRegion
  countryCode: string
  slot: string
  close: () => void
}

export default function BookingCheckout({ 
  product, 
  variant, 
  region, 
  countryCode, 
  slot,
  close 
}: BookingCheckoutProps) {
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentProviders, setPaymentProviders] = useState<HttpTypes.StorePaymentProvider[]>([])
  
  // Form State
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    promo_code: ""
  })
  
  const [formStep, setFormStep] = useState<"details" | "payment">("details")
  const [applyingPromo, setApplyingPromo] = useState(false)
  const [initializingPayment, setInitializingPayment] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)

  // 1. Initialize Cart with the Slot Item
  useEffect(() => {
    const initBooking = async () => {
      try {
        setLoading(true)
        
        // Fetch available payment methods for the region
        const providers = await listCartPaymentMethods(region.id)
        setPaymentProviders(providers || [])

        // Create a dedicated cart for this booking
        const newCart = await createInstantCart({
          variantId: variant.id,
          quantity: 1,
          countryCode,
          metadata: {
            appointment_slot: slot,
            product_name: product.title
          }
        })
        setCart(newCart)
      } catch (err) {
        console.error("Failed to init booking cart", err)
      } finally {
        setLoading(false)
      }
    }
    initBooking()
  }, [variant.id, countryCode, region.id, slot, product.title])

  // 2. Handle Customer Details Submit
  const handleDetailsSubmit = async () => {
    if (!cart) return
    setLoading(true)
    
    try {
      // Update Cart with Email & Address (Address is often required for payment providers)
      const updatedCart = await updateCart({
        email: formData.email,
        shipping_address: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          address_1: "Digital Booking", 
          city: "Digital",
          country_code: countryCode,
          postal_code: "000000"
        },
        billing_address: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            address_1: "Digital Booking",
            city: "Digital",
            country_code: countryCode,
            postal_code: "000000"
        }
      }, cart.id)
      
      setCart(updatedCart)
      setFormStep("payment") // Move to payment step
    } catch (err) {
      console.error("Failed to update customer details", err)
    } finally {
      setLoading(false)
    }
  }

  // 3. Handle Coupon Application
  const handleApplyCoupon = async () => {
    if (!cart || !formData.promo_code) return
    setApplyingPromo(true)
    setPromoError(null)

    try {
      await applyPromotions([formData.promo_code], cart.id)
      // Refresh cart to see discount
      const refreshedCart = await retrieveCart(cart.id, undefined, true)
      setCart(refreshedCart)
    } catch (err: any) {
      setPromoError(err.message || "Invalid coupon")
    } finally {
      setApplyingPromo(false)
    }
  }

  // 4. Handle Payment Method Selection
  const handlePaymentSelect = async (providerId: string) => {
    if (!cart) return
    setInitializingPayment(true)
    try {
        await initiatePaymentSession(cart, {
            provider_id: providerId
        })
        // Refresh cart to get the active session
        const refreshedCart = await retrieveCart(cart.id, undefined, true)
        setCart(refreshedCart)
    } catch (err) {
        console.error("Payment init failed", err)
    } finally {
        setInitializingPayment(false)
    }
  }

  if (loading && !cart) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center gap-4">
                <Spinner className="animate-spin" />
                <Text>Preparing your booking...</Text>
            </div>
        </div>
    )
  }

  const activeSession = cart?.payment_collection?.payment_sessions?.find(s => s.status === "pending")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
          <div>
            <Heading level="h2" className="text-lg">Confirm Booking</Heading>
            <Text className="text-sm text-gray-500">
               {new Date(slot).toLocaleString()}
            </Text>
          </div>
          <button onClick={close} className="text-gray-400 hover:text-black">✕</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          
          {/* STEP 1: CUSTOMER DETAILS */}
          {formStep === "details" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label size="small" className="mb-1">First Name</Label>
                  <Input 
                    placeholder="John"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label size="small" className="mb-1">Last Name</Label>
                  <Input 
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label size="small" className="mb-1">Email</Label>
                <Input 
                  placeholder="john@example.com"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                 <Label size="small" className="mb-1">Phone</Label>
                 <Input 
                   placeholder="9876543210"
                   type="tel"
                   value={formData.phone}
                   onChange={(e) => setFormData({...formData, phone: e.target.value})}
                 />
              </div>

              <Button 
                className="mt-4 w-full" 
                size="large"
                onClick={handleDetailsSubmit}
                disabled={!formData.email || !formData.first_name || !formData.phone || loading}
                isLoading={loading}
              >
                Next
              </Button>
            </div>
          )}

          {/* STEP 2: PAYMENT & COUPON */}
          {formStep === "payment" && cart && (
            <div className="flex flex-col gap-6">
                
                {/* Order Summary */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 border">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Consultation Fee</span>
                        <span>{formatCurrency(cart.subtotal ?? 0, cart.currency_code)}</span>
                    </div>
                    {cart.discount_total > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                            <span>Discount</span>
                            <span>-{formatCurrency(cart.discount_total, cart.currency_code)}</span>
                        </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-bold mt-2">
                        <span>Total</span>
                        <span>{formatCurrency(cart.total ?? 0, cart.currency_code)}</span>
                    </div>
                </div>

                {/* Coupon Code */}
                <div>
                   <Label size="small" className="mb-1">Promo Code</Label>
                   <div className="flex gap-2">
                      <Input 
                        placeholder="SUMMER20" 
                        value={formData.promo_code}
                        onChange={(e) => setFormData({...formData, promo_code: e.target.value})}
                      />
                      <Button 
                        variant="secondary" 
                        onClick={handleApplyCoupon}
                        isLoading={applyingPromo}
                      >
                        Apply
                      </Button>
                   </div>
                   {promoError && <Text className="text-red-500 text-xs mt-1">{promoError}</Text>}
                </div>

                {/* Payment Methods */}
                <div>
                    <Heading level="h3" className="text-md mb-3">Select Payment Method</Heading>
                    <div className="grid grid-cols-1 gap-2">
                        {paymentProviders.length === 0 && <Text>No payment methods found.</Text>}
                        
                        {paymentProviders.map(provider => (
                            <div 
                                key={provider.id}
                                onClick={() => handlePaymentSelect(provider.id)}
                                className={clx(
                                    "p-4 border rounded-md cursor-pointer transition-all flex items-center justify-between",
                                    activeSession?.provider_id === provider.id 
                                        ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" 
                                        : "hover:border-gray-400"
                                )}
                            >
                                <span className="font-medium capitalize">{provider.id.replace(/_/g, " ").replace("pp ", "").replace("default", "")}</span>
                                {activeSession?.provider_id === provider.id && (
                                    <div className="w-4 h-4 bg-blue-600 rounded-full" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pay Button */}
                <div className="mt-2">
                    {activeSession ? (
                        <PaymentButton cart={cart} data-testid="booking-pay-btn" />
                    ) : (
                        <Button disabled className="w-full" size="large">Select a Payment Method</Button>
                    )}
                </div>
                
                <button 
                    onClick={() => setFormStep("details")}
                    className="text-xs text-gray-500 underline text-center w-full hover:text-gray-800"
                >
                    Edit Details
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}