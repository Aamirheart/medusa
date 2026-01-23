// "use client"

// import { useEffect, useState } from "react"
// import { HttpTypes } from "@medusajs/types"
// import { Button, Heading, Text, Input, Label, clx } from "@medusajs/ui"
// import { formatCurrency } from "@lib/util/money"
// import { 
//   createCustomTherapistCart, 
//   updateCart, 
//   applyPromotions, 
//   initiatePaymentSession, 
//   retrieveCart 
// } from "@lib/data/cart"
// import { listCartPaymentMethods } from "@lib/data/payment"
// import PaymentButton from "@modules/checkout/components/payment-button"
// import { Spinner } from "@medusajs/icons"

// type BookingCheckoutProps = {
//   product: HttpTypes.StoreProduct
//   variant: HttpTypes.StoreProductVariant
//   region: HttpTypes.StoreRegion
//   countryCode: string
//   slot: string
//   therapistId: string 
//   close: () => void
// }

// export default function BookingCheckout({ 
//   product, 
//   variant, 
//   region, 
//   countryCode, 
//   slot,
//   therapistId, 
//   close 
// }: BookingCheckoutProps) {
//   const [cart, setCart] = useState<HttpTypes.StoreCart | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [paymentProviders, setPaymentProviders] = useState<HttpTypes.StorePaymentProvider[]>([])
  
//   // Form State
//   const [formData, setFormData] = useState({
//     first_name: "",
//     last_name: "",
//     email: "",
//     phone: "",
//     promo_code: ""
//   })
  
//   const [formStep, setFormStep] = useState<"details" | "payment">("details")
//   const [applyingPromo, setApplyingPromo] = useState(false)
//   const [initializingPayment, setInitializingPayment] = useState(false)
//   const [promoError, setPromoError] = useState<string | null>(null)

//   // 1. Initialize Cart with Custom Pricing Logic
//   useEffect(() => {
//     const initBooking = async () => {
//       try {
//         setLoading(true)
        
//         // Fetch available payment methods for the region
//         const providers = await listCartPaymentMethods(region.id)
//         setPaymentProviders(providers || [])

//         // Call backend API to create cart with dynamic price
//         const newCart = await createCustomTherapistCart({
//           variantId: variant.id,
//           quantity: 1,
//           countryCode,
//           therapistId: therapistId, 
//           slot: slot
//         })

//         setCart(newCart)
//       } catch (err) {
//         console.error("Failed to init booking cart", err)
//       } finally {
//         setLoading(false)
//       }
//     }
//     initBooking()
//   }, [variant.id, countryCode, region.id, slot, therapistId])

//   // 2. Handle Customer Details Submit
//   const handleDetailsSubmit = async () => {
//     if (!cart) return
//     setLoading(true)
    
//     try {
//       // Update Cart with Email & Address
//       const updatedCart = await updateCart({
//         email: formData.email,
//         shipping_address: {
//           first_name: formData.first_name,
//           last_name: formData.last_name,
//           phone: formData.phone,
//           address_1: "Digital Booking", 
//           city: "Digital",
//           country_code: countryCode,
//           postal_code: "000000"
//         },
//         billing_address: {
//             first_name: formData.first_name,
//             last_name: formData.last_name,
//             phone: formData.phone,
//             address_1: "Digital Booking",
//             city: "Digital",
//             country_code: countryCode,
//             postal_code: "000000"
//         }
//       }, cart.id)
      
//       setCart(updatedCart)
//       setFormStep("payment") 
//     } catch (err) {
//       console.error("Failed to update customer details", err)
//     } finally {
//       setLoading(false)
//     }
//   }

//   // 3. Handle Coupon Application
//   const handleApplyCoupon = async () => {
//     if (!cart || !formData.promo_code) return
//     setApplyingPromo(true)
//     setPromoError(null)

//     try {
//       await applyPromotions([formData.promo_code], cart.id)
//       const refreshedCart = await retrieveCart(cart.id, undefined, true)
//       setCart(refreshedCart)
//     } catch (err: any) {
//       setPromoError(err.message || "Invalid coupon")
//     } finally {
//       setApplyingPromo(false)
//     }
//   }

//   // 4. Handle Payment Method Selection
//   const handlePaymentSelect = async (providerId: string) => {
//     if (!cart) return
//     setInitializingPayment(true)
//     try {
//         await initiatePaymentSession(cart, {
//             provider_id: providerId
//         })
//         const refreshedCart = await retrieveCart(cart.id, undefined, true)
//         setCart(refreshedCart)
//     } catch (err) {
//         console.error("Payment init failed", err)
//     } finally {
//         setInitializingPayment(false)
//     }
//   }

//   if (loading && !cart) {
//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
//             <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center gap-4">
//                 <Spinner className="animate-spin" />
//                 <Text>Preparing your booking...</Text>
//             </div>
//         </div>
//     )
//   }

//   const activeSession = cart?.payment_collection?.payment_sessions?.find(s => s.status === "pending")

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
//       <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
//         {/* Header */}
//         <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
//           <div>
//             <Heading level="h2" className="text-lg">Confirm Booking</Heading>
//             <Text className="text-sm text-gray-500">
//                {new Date(slot).toLocaleString()}
//             </Text>
//           </div>
//           <button onClick={close} className="text-gray-400 hover:text-black">✕</button>
//         </div>

//         <div className="p-6 overflow-y-auto flex-1">
          
//           {/* STEP 1: CUSTOMER DETAILS */}
//           {formStep === "details" && (
//             <div className="flex flex-col gap-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label size="small" className="mb-1">First Name</Label>
//                   <Input 
//                     placeholder="John"
//                     value={formData.first_name}
//                     onChange={(e) => setFormData({...formData, first_name: e.target.value})}
//                   />
//                 </div>
//                 <div>
//                   <Label size="small" className="mb-1">Last Name</Label>
//                   <Input 
//                     placeholder="Doe"
//                     value={formData.last_name}
//                     onChange={(e) => setFormData({...formData, last_name: e.target.value})}
//                   />
//                 </div>
//               </div>

//               <div>
//                 <Label size="small" className="mb-1">Email</Label>
//                 <Input 
//                   placeholder="john@example.com"
//                   type="email"
//                   value={formData.email}
//                   onChange={(e) => setFormData({...formData, email: e.target.value})}
//                 />
//               </div>

//               <div>
//                  <Label size="small" className="mb-1">Phone</Label>
//                  <Input 
//                    placeholder="9876543210"
//                    type="tel"
//                    value={formData.phone}
//                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
//                  />
//               </div>

//               <Button 
//                 className="mt-4 w-full" 
//                 size="large"
//                 onClick={handleDetailsSubmit}
//                 disabled={!formData.email || !formData.first_name || !formData.phone || loading}
//                 isLoading={loading}
//               >
//                 Next
//               </Button>
//             </div>
//           )}

//           {/* STEP 2: PAYMENT & COUPON */}
//           {formStep === "payment" && cart && (
//             <div className="flex flex-col gap-6">
                
//                 {/* Order Summary */}
//                 <div className="bg-gray-50 p-4 rounded-lg space-y-2 border">
//                     <div className="flex justify-between text-sm">
//                         {/* 1. Item Title */}
//                         <span className="text-gray-600">
//                           {cart.items?.[0]?.title || "Consultation Fee"}
//                         </span>
                        
//                         {/* 2. Item Price */}
//                         <span>
//                           {formatCurrency(cart.subtotal ?? 0, cart.currency_code)}
//                         </span>
//                     </div>

//                     {cart.discount_total > 0 && (
//                         <div className="flex justify-between text-sm text-green-600">
//                             <span>Discount</span>
//                             <span>-{formatCurrency(cart.discount_total, cart.currency_code)}</span>
//                         </div>
//                     )}
                    
//                     <div className="border-t pt-2 flex justify-between font-bold mt-2">
//                         <span>Total</span>
//                         <span>{formatCurrency(cart.total ?? 0, cart.currency_code)}</span>
//                     </div>
//                 </div>

//                 {/* Coupon Code */}
//                 <div>
//                    <Label size="small" className="mb-1">Promo Code</Label>
//                    <div className="flex gap-2">
//                       <Input 
//                         placeholder="SUMMER20" 
//                         value={formData.promo_code}
//                         onChange={(e) => setFormData({...formData, promo_code: e.target.value})}
//                       />
//                       <Button 
//                         variant="secondary" 
//                         onClick={handleApplyCoupon}
//                         isLoading={applyingPromo}
//                       >
//                         Apply
//                       </Button>
//                    </div>
//                    {promoError && <Text className="text-red-500 text-xs mt-1">{promoError}</Text>}
//                 </div>

//                 {/* Payment Methods */}
//                 <div>
//                     <Heading level="h3" className="text-md mb-3">Select Payment Method</Heading>
//                     <div className="grid grid-cols-1 gap-2">
//                         {paymentProviders.length === 0 && <Text>No payment methods found.</Text>}
                        
//                         {paymentProviders.map(provider => (
//                             <div 
//                                 key={provider.id}
//                                 onClick={() => handlePaymentSelect(provider.id)}
//                                 className={clx(
//                                     "p-4 border rounded-md cursor-pointer transition-all flex items-center justify-between",
//                                     activeSession?.provider_id === provider.id 
//                                         ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" 
//                                         : "hover:border-gray-400"
//                                 )}
//                             >
//                                 <span className="font-medium capitalize">{provider.id.replace(/_/g, " ").replace("pp ", "").replace("default", "")}</span>
//                                 {activeSession?.provider_id === provider.id && (
//                                     <div className="w-4 h-4 bg-blue-600 rounded-full" />
//                                 )}
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* Pay Button */}
//                 <div className="mt-2">
//                     {activeSession ? (
//                         <PaymentButton cart={cart} data-testid="booking-pay-btn" />
//                     ) : (
//                         <Button disabled className="w-full" size="large">Select a Payment Method</Button>
//                     )}
//                 </div>
                
//                 <button 
//                     onClick={() => setFormStep("details")}
//                     className="text-xs text-gray-500 underline text-center w-full hover:text-gray-800"
//                 >
//                     Edit Details
//                 </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }


"use client"

import { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import { formatCurrency } from "@lib/util/money"
import { listCartPaymentMethods } from "@lib/data/payment"
import { applyPromotions, initiatePaymentSession, retrieveCart } from "@lib/data/cart"
import PaymentButton from "@modules/checkout/components/payment-button"
import { clx } from "@medusajs/ui"
import { User, Calendar, Mail, Phone, MapPin } from "lucide-react"

type BookingCheckoutProps = {
  cart: HttpTypes.StoreCart
  region: HttpTypes.StoreRegion
  therapistName: string
  refreshCart: () => Promise<void>
}

export default function BookingCheckout({ cart: initialCart, region, therapistName, refreshCart }: BookingCheckoutProps) {
  const [cart, setCart] = useState(initialCart)
  const [paymentProviders, setPaymentProviders] = useState<HttpTypes.StorePaymentProvider[]>([])
  const [promoCode, setPromoCode] = useState("")
  const [promoError, setPromoError] = useState<string | null>(null)
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
        const providers = await listCartPaymentMethods(region.id)
        setPaymentProviders(providers || [])
    }
    loadData()
  }, [region.id])

  const handleApplyPromo = async () => {
    if (!promoCode) return
    setIsApplyingPromo(true)
    setPromoError(null)
    try {
        await applyPromotions([promoCode], cart.id)
        const updated = await retrieveCart(cart.id, undefined, true)
        setCart(updated)
    } catch (e: any) {
        setPromoError(e.message || "Invalid code")
    } finally {
        setIsApplyingPromo(false)
    }
  }

  const handlePaymentSelect = async (providerId: string) => {
    setActiveProviderId(providerId)
    await initiatePaymentSession(cart, { provider_id: providerId })
    const updated = await retrieveCart(cart.id, undefined, true)
    setCart(updated)
  }

  const activeSession = cart.payment_collection?.payment_sessions?.find(s => s.status === "pending")
  const shippingAddress = cart.shipping_address
  const rawSlot = cart.items?.[0]?.metadata?.appointment_slot as string

  // Format Date Logic
  let formattedDate = "Date not selected"
  let formattedTime = ""
  
  if (rawSlot) {
      const dateObj = new Date(rawSlot)
      if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
          formattedTime = dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
      } else {
          // Fallback if raw string is not standard Date format
          formattedDate = rawSlot 
      }
  }

  return (
    <div className="flex flex-col gap-6">
        
        {/* 1. BOOKING DETAILS CARD */}
        <div className="bg-[#E5F7F9] border border-[#00838F] rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Calendar size={100} color="#00838F" />
            </div>
            
            <h3 className="font-bold text-[#043953] mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Appointment Details
            </h3>

            <div className="space-y-3 relative z-10">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold">Therapist</span>
                    <span className="text-lg font-bold text-[#00838F]">{therapistName}</span>
                </div>
                
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold">Date & Time</span>
                    <span className="text-base font-semibold text-gray-800">
                        {formattedDate} <span className="text-gray-400">|</span> {formattedTime}
                    </span>
                </div>

                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold">Session Type</span>
                    <span className="text-sm font-medium text-gray-700">Online / Video Consultation</span>
                </div>
            </div>
        </div>

        {/* 2. PATIENT DETAILS CARD */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-bold text-[#043953] mb-4 flex items-center gap-2">
                <User className="w-5 h-5" /> Patient Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-full"><User size={16} className="text-gray-500"/></div>
                    <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="font-medium text-gray-800">{shippingAddress?.first_name} {shippingAddress?.last_name}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-full"><Mail size={16} className="text-gray-500"/></div>
                    <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium text-gray-800">{cart.email}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-full"><Phone size={16} className="text-gray-500"/></div>
                    <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="font-medium text-gray-800">{shippingAddress?.phone}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. PAYMENT SUMMARY */}
        <div className="bg-[#F9FAFB] border border-gray-200 rounded-2xl p-6">
            <h3 className="font-bold text-gray-800 mb-4">Payment Summary</h3>
            
            <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Consultation Fee</span>
                <span className="font-bold text-black">{formatCurrency(cart.subtotal ?? 0, cart.currency_code)}</span>
            </div>

            {cart.discount_total > 0 && (
                <div className="flex justify-between items-center text-green-600 mb-2">
                    <span>Discount</span>
                    <span>-{formatCurrency(cart.discount_total, cart.currency_code)}</span>
                </div>
            )}

            <div className="border-t border-dashed border-gray-300 my-3"></div>

            <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-[#043953]">Total Pay</span>
                <span className="text-xl font-extrabold text-[#00838F]">{formatCurrency(cart.total ?? 0, cart.currency_code)}</span>
            </div>

            {/* Promo Code */}
            <div className="mt-6">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Have a Coupon?</label>
                <div className="flex gap-2 mt-2">
                    <input 
                        className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00838F]"
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <button 
                        onClick={handleApplyPromo}
                        disabled={isApplyingPromo || !promoCode}
                        className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-800"
                    >
                        {isApplyingPromo ? "..." : "Apply"}
                    </button>
                </div>
                {promoError && <p className="text-red-500 text-xs mt-2">{promoError}</p>}
            </div>
        </div>

        {/* 4. PAYMENT METHODS */}
        <div>
            <h3 className="font-bold text-gray-800 mb-4">Select Payment Method</h3>
            <div className="space-y-3">
                {paymentProviders.length === 0 && <p className="text-gray-500 text-sm">Loading payment options...</p>}
                
                {paymentProviders.map((p) => (
                    <div 
                        key={p.id}
                        onClick={() => handlePaymentSelect(p.id)}
                        className={clx(
                            "border rounded-xl p-4 cursor-pointer flex items-center justify-between transition-all",
                            activeSession?.provider_id === p.id 
                                ? "border-[#00838F] bg-[#E5F7F9] ring-1 ring-[#00838F]" 
                                : "border-gray-200 hover:border-gray-300 bg-white"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <span className="capitalize font-medium text-gray-700">{p.id.replace(/_/g, " ")}</span>
                        </div>
                        <div className={clx("w-5 h-5 rounded-full border flex items-center justify-center", activeSession?.provider_id === p.id ? "border-[#00838F]" : "border-gray-300")}>
                            {activeSession?.provider_id === p.id && <div className="w-3 h-3 bg-[#00838F] rounded-full" />}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* PAY BUTTON */}
        <div className="mt-2">
             {activeSession ? (
                 <PaymentButton cart={cart} data-testid="pay-button" />
             ) : (
                 <button disabled className="w-full bg-gray-200 text-gray-500 py-4 rounded-xl font-bold cursor-not-allowed">
                    Select a Payment Method
                 </button>
             )}
        </div>
    </div>
  )
}