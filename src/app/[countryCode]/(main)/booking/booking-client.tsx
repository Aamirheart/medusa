// "use client"

// import { useState, useMemo } from "react"
// import { Button, Heading, Text, clx } from "@medusajs/ui"
// import { HttpTypes } from "@medusajs/types"
// import BookingCheckout from "./booking-checkout"
// import { User } from "@medusajs/icons"

// type BookingClientProps = {
//   slotsData: {
//     dates: string[]
//     Slots: string[]
//   }
//   product: HttpTypes.StoreProduct
//   variant: HttpTypes.StoreProductVariant
//   countryCode: string
//   region: HttpTypes.StoreRegion
// }

// // 1. Define Therapists with Multipliers
// const THERAPISTS = [
//   { 
//     id: "10", 
//     name: "Dr. Aamir (Standard)", 
//     specialty: "General Therapy", 
//     multiplier: 1 // Pays Base Price (e.g., 1000 INR)
//   },
//   { 
//     id: "11", 
//     name: "Dr. Sarah (Specialist)", 
//     specialty: "Advanced Care", 
//     multiplier: 2 // Pays 2x Base Price (e.g., 2000 INR)
//   }
// ]

// export default function BookingClient({ 
//   slotsData, 
//   product, 
//   variant, 
//   countryCode, 
//   region,
// }: BookingClientProps) {
  
//   const [selectedTherapistId, setSelectedTherapistId] = useState<string>(THERAPISTS[0].id)
//   const [selectedDate, setSelectedDate] = useState<string>(slotsData?.dates?.[0] || "")
//   const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
//   const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

//   // 1. CLEAN URL LOGIC
//   // If we are in "in" (India), keep the URL clean (empty string). 
//   // Else use the country code (e.g. "us").
//   const cleanCountryCode = countryCode === "in" ? "" : countryCode

//   // 2. PRICING LOGIC
//   // Medusa has already given us the correct price for this Region (INR or USD).
//   const basePrice = variant?.calculated_price?.calculated_amount || 0
  
//   const formatPrice = (amount: number) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: region?.currency_code?.toUpperCase() || "INR",
//     }).format(amount)
//   }

//   // Filter slots for the selected date
//   const availableTimeSlots = useMemo(() => {
//     if (!slotsData?.Slots) return []
    
//     return slotsData.Slots.filter(slot => slot.startsWith(selectedDate))
//       .map(slot => {
//         const timePart = slot.split(" ")[1] 
//         return {
//           full: slot,
//           display: timePart.slice(0, 5) 
//         }
//       })
//   }, [selectedDate, slotsData])

//   const handleBookClick = () => {
//     if (selectedSlot) {
//       setIsCheckoutOpen(true)
//     }
//   }

//   const currentTherapist = THERAPISTS.find(t => t.id === selectedTherapistId)
//   // Calculate price: Base Region Price * Therapist Multiplier
//   const currentPrice = basePrice * (currentTherapist?.multiplier || 1)

//   // Safety Check
//   if (!product || !region) {
//     return (
//       <div className="p-8 text-center border rounded-lg bg-gray-50">
//         <Heading level="h2" className="text-red-500">Configuration Error</Heading>
//         <Text>Product or Region not found. Please check Medusa Admin.</Text>
//       </div>
//     )
//   }

//   return (
//     <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      
//       {/* SECTION 1: Therapist Selection */}
//       <div className="mb-8">
//         <Heading level="h2" className="text-lg mb-4">1. Choose your Therapist</Heading>
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           {THERAPISTS.map((therapist) => {
//             const price = basePrice * therapist.multiplier

//             return (
//               <div 
//                 key={therapist.id}
//                 onClick={() => setSelectedTherapistId(therapist.id)}
//                 className={clx(
//                   "cursor-pointer p-4 rounded-lg border transition-all flex items-start gap-4",
//                   selectedTherapistId === therapist.id
//                     ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
//                     : "border-gray-200 hover:border-gray-300 bg-white"
//                 )}
//               >
//                 <div className={clx(
//                   "p-2 rounded-full",
//                   selectedTherapistId === therapist.id ? "bg-blue-200 text-blue-700" : "bg-gray-100 text-gray-500"
//                 )}>
//                   <User />
//                 </div>
//                 <div>
//                   <Text className="font-bold text-base">{therapist.name}</Text>
//                   <Text className="text-sm text-gray-500">{therapist.specialty}</Text>
//                   <Text className="text-sm font-medium mt-1">
//                     {formatPrice(price)}
//                   </Text>
//                 </div>
//               </div>
//             )
//           })}
//         </div>
//       </div>

//       {/* SECTION 2: Date Selector */}
//       <div className="mb-8">
//         <Heading level="h2" className="text-lg mb-4">2. Select Date</Heading>
//         <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
//           {slotsData?.dates?.map((date) => (
//             <button
//               key={date}
//               onClick={() => {
//                 setSelectedDate(date)
//                 setSelectedSlot(null)
//               }}
//               className={clx(
//                 "px-4 py-3 rounded-md border min-w-[100px] transition-all text-sm font-medium whitespace-nowrap",
//                 selectedDate === date
//                   ? "border-black bg-black text-white shadow-md"
//                   : "border-gray-200 hover:border-gray-400 text-gray-700 bg-gray-50"
//               )}
//             >
//               {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* SECTION 3: Time Slot Grid */}
//       <div className="mb-8">
//         <Heading level="h2" className="text-lg mb-4">3. Select Time</Heading>
        
//         {availableTimeSlots.length === 0 ? (
//           <Text className="text-gray-500 italic">No slots available for this date.</Text>
//         ) : (
//           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
//             {availableTimeSlots.map(({ full, display }) => (
//               <button
//                 key={full}
//                 onClick={() => setSelectedSlot(full)}
//                 className={clx(
//                   "py-2 px-3 rounded-md text-sm border transition-all",
//                   selectedSlot === full
//                     ? "border-blue-600 bg-blue-50 text-blue-700 font-bold ring-1 ring-blue-600"
//                     : "border-gray-200 hover:border-gray-300 text-gray-600"
//                 )}
//               >
//                 {display}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* SECTION 4: Action Button */}
//       <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
//          <div className="text-sm text-gray-600">
//             Summary: <span className="font-bold text-black">{currentTherapist?.name}</span> @ {selectedSlot ? selectedSlot : "..."}
//          </div>

//         <Button 
//           variant="primary" 
//           size="large" 
//           disabled={!selectedSlot}
//           onClick={handleBookClick}
//           className="w-full sm:w-auto"
//         >
//           Book for {formatPrice(currentPrice)}
//         </Button>
//       </div>

    
//       {/* SECTION 5: Checkout Modal */}
//       {isCheckoutOpen && selectedSlot && (
//         <BookingCheckout 
//           product={product}
//           variant={variant}
//           countryCode={countryCode} // <--- CHANGED: Pass the original prop, not cleanCountryCode
//           region={region}
//           slot={selectedSlot}
//           therapistId={selectedTherapistId}
//           close={() => setIsCheckoutOpen(false)}
//         />
//       )}
//     </div>
//   )
// }


"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation } from "swiper/modules"
import { clx } from "@medusajs/ui"
import BookingCheckout from "./booking-checkout"
import { createCustomTherapistCart, updateCart } from "@lib/data/cart"
import { Star, ThumbsUp, MapPin, ArrowLeft } from "lucide-react"

// Styles for Swiper
import "swiper/css"
import "swiper/css/navigation"

type BookingClientProps = {
  slotsData: {
    dates: string[]
    Slots: string[]
  }
  product: HttpTypes.StoreProduct
  variant: HttpTypes.StoreProductVariant
  countryCode: string
  region: HttpTypes.StoreRegion
}

// --- SUB-COMPONENT: Left Side Profile ---
function TherapistProfile() {
  return (
    <div className="bg-[#EAF7FC] rounded-[30px] p-6 text-[#043953] h-full flex flex-col justify-between shadow-lg">
      
      {/* 1. Header & Name */}
      <div>
        <div className="flex justify-between items-start mb-4">
            <button className="md:hidden text-[#043953]"><ArrowLeft /></button>
            <div className="bg-white p-2 rounded-full shadow-sm ml-auto">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#043953]">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            </div>
        </div>

        <div className="flex gap-4 mb-6">
            <div className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-full overflow-hidden border-4 border-white shadow-md shrink-0">
                 <Image src="/demoimg.png" alt="Vikasine Pramodh" width={100} height={100} className="w-full h-full object-cover"/>
            </div>
            <div>
                <p className="text-lg font-medium opacity-80">Individual Therapy</p>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#00838F] leading-tight">Vikasine Pramodh</h1>
            </div>
        </div>

        {/* 2. Stats */}
        <div className="space-y-2 mb-6 text-sm md:text-base">
            <p className="flex items-center gap-2 font-medium">
                <span className="bg-yellow-100 text-yellow-700 p-1 rounded">⭐</span> 
                Therapist Rating: <span className="font-bold">4.9/5</span>
            </p>
            <p className="flex items-center gap-2 font-medium">
                <span className="bg-blue-100 text-blue-700 p-1 rounded">👍</span> 
                Recommended By: <span className="font-bold">500+ Clients</span>
            </p>
        </div>

        {/* 3. Testimonial Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 relative">
            <div className="absolute -top-3 left-4 bg-[#043953] text-white text-xs px-2 py-1 rounded">Testimonial</div>
            <div className="flex items-center gap-3 mb-2 mt-2">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">V</div>
                <div>
                    <p className="font-bold text-sm">Veer, 31</p>
                    <p className="text-xs text-gray-500">Photographer</p>
                </div>
            </div>
            <p className="text-sm text-gray-600 italic leading-relaxed">
                &quot;I kept comparing my work to others online. Sindhuja helped me stop chasing validation and focus on my own journey.&quot;
            </p>
        </div>

        {/* 4. Recommended For */}
        <div className="mb-6">
             <p className="font-bold mb-2 text-sm uppercase tracking-wide opacity-70">Recommended For:</p>
             <div className="flex flex-wrap gap-2">
                 {["Anxiety", "Depression", "Relationship", "Trauma", "Sleep"].map(tag => (
                     <span key={tag} className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-[#00838F] shadow-sm">
                         {tag}
                     </span>
                 ))}
             </div>
        </div>
      </div>

      {/* 5. Footer Location */}
      <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm mt-auto">
           <div className="bg-[#EAF7FC] p-2 rounded-full">
               <MapPin className="text-[#00838F] w-5 h-5" />
           </div>
           <p className="font-semibold text-sm text-[#043953]">Offline Session in Kormangala | 60 min</p>
      </div>

    </div>
  )
}

// --- SUB-COMPONENT: Slot Group ---
function SlotGroup({ title, slots, selected, onSelect }: { title: string, slots: string[], selected: string | null, onSelect: (v: string) => void }) {
    if (!slots?.length) return null;
    const formatTo12Hour = (time: string) => {
      const [hourStr, minute] = time.split(":");
      let hour = parseInt(hourStr, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      hour = hour % 12 || 12;
      return `${hour.toString().padStart(2, "0")}:${minute} ${ampm}`;
    };
    return (
        <div className="mb-6">
            <p className="font-bold text-[#043953] mb-3 text-lg border-b pb-2">{title}</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {slots.map((slot) => (
                    <button
                        key={slot}
                        onClick={() => onSelect(slot)}
                        className={`rounded-xl py-3 text-sm font-medium transition-all duration-200 border text-center
                          ${selected === slot
                                ? "bg-[#E5F7F9] border-[#00838F] text-[#00838F] shadow-md scale-105 ring-1 ring-[#00838F]"
                                : "bg-white border-gray-200 text-gray-500 hover:border-[#00838F] hover:text-[#00838F]"
                            }`}
                    >
                          {formatTo12Hour(slot)}
                    </button>
                ))}
            </div>
        </div>
    );
}

// --- SUB-COMPONENT: Date Helper ---
const getDayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      day: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
      date: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    };
};

export default function BookingClient({ 
  slotsData, 
  product, 
  variant, 
  countryCode, 
  region,
}: BookingClientProps) {

  // State
  const [step, setStep] = useState<"slot" | "form" | "checkout">("slot")
  const [selectedDate, setSelectedDate] = useState<string>(slotsData.dates[0] || "")
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({ firstName: "", lastName: "", phone: "", email: "", dialCode: "91" })
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Data Processing
  const dates = slotsData.dates || []
  
  const filteredSlots = useMemo(() => {
    if (!selectedDate || !slotsData.Slots) return [];
    return slotsData.Slots
        .filter((s) => s.startsWith(selectedDate))
        .map((s) => s.split(" ")[1]); 
  }, [slotsData.Slots, selectedDate]);

  const groupedSlots = useMemo(() => {
    const groups = { morning: [] as string[], afternoon: [] as string[], evening: [] as string[] };
    filteredSlots.forEach((time) => {
        const hour = parseInt(time.split(":")[0]);
        if (hour < 12) groups.morning.push(time);
        else if (hour < 17) groups.afternoon.push(time);
        else groups.evening.push(time);
    });
    return groups;
  }, [filteredSlots]);

  // Handlers
  const handleProceedToForm = () => { if (selectedSlot) setStep("form") }

  const handleProceedToCheckout = async () => {
    if (!selectedSlot) return
    setIsLoading(true)
    try {
        const apiCountryCode = countryCode 
        const therapistId = "10" // Using dummy ID for now

        // 1. Create Cart
        const newCart = await createCustomTherapistCart({
            variantId: variant.id,
            quantity: 1,
            countryCode: apiCountryCode, 
            therapistId: therapistId,
            slot: `${selectedDate} ${selectedSlot}`
        })

        if (!newCart) throw new Error("Failed to create cart")

        // 2. Update Details
        const updatedCart = await updateCart({
            email: formData.email,
            shipping_address: {
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone: `+${formData.dialCode}${formData.phone}`,
                address_1: "Digital Booking",
                city: "Digital",
                country_code: countryCode,
                postal_code: "000000"
            }
        }, newCart.id)

        setCart(updatedCart)
        setStep("checkout")
    } catch (e) {
        console.error(e)
        alert("Something went wrong initializing the booking.")
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Therapist Profile */}
        <div className="lg:col-span-5 sticky top-8">
            <TherapistProfile />
        </div>

        {/* RIGHT COLUMN: Booking Flow */}
        <div className="lg:col-span-7 bg-white rounded-[30px] shadow-lg p-6 md:p-8 min-h-[600px] border border-gray-100">
            
            {/* STEP 1: Slots */}
            {step === "slot" && (
                <div className="animate-fade-in">
                    <h2 className="text-xl font-bold text-[#043953] mb-6">Select Date & Time</h2>
                    
                    {/* Date Swiper */}
                    <div className="flex items-center gap-2 mb-8 bg-gray-50 p-2 rounded-2xl">
                        <button className="swiper-prev-custom w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-[#043953] hover:bg-gray-100">&lt;</button>
                        
                        <Swiper
                            modules={[Navigation]}
                            navigation={{ prevEl: ".swiper-prev-custom", nextEl: ".swiper-next-custom" }}
                            breakpoints={{
                                0: { slidesPerView: 3, spaceBetween: 8 },
                                768: { slidesPerView: 4, spaceBetween: 12 },
                            }}
                            className="flex-1"
                        >
                            {dates.map((date) => {
                                const { day, date: dNum, month } = getDayDate(date);
                                const isActive = selectedDate === date;
                                return (
                                    <SwiperSlide key={date}>
                                        <button
                                            onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                                            className={`w-full rounded-xl py-3 px-1 border transition-all duration-200 flex flex-col items-center justify-center
                                                ${isActive 
                                                    ? "bg-[#043953] border-[#043953] text-white shadow-md scale-105" 
                                                    : "bg-white border-gray-200 text-gray-500 hover:border-[#043953]"
                                                }`}
                                        >
                                            <span className="text-[10px] font-medium uppercase tracking-wider">{day}</span>
                                            <span className="text-sm font-bold leading-none mt-1">{month} {dNum}</span>
                                        </button>
                                    </SwiperSlide>
                                )
                            })}
                        </Swiper>

                        <button className="swiper-next-custom w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-[#043953] hover:bg-gray-100">&gt;</button>
                    </div>

                    {/* Time Slots */}
                    <div className="space-y-2 min-h-[250px]">
                        {groupedSlots.morning.length > 0 && <SlotGroup title="Morning" slots={groupedSlots.morning} selected={selectedSlot} onSelect={setSelectedSlot} />}
                        {groupedSlots.afternoon.length > 0 && <SlotGroup title="Afternoon" slots={groupedSlots.afternoon} selected={selectedSlot} onSelect={setSelectedSlot} />}
                        {groupedSlots.evening.length > 0 && <SlotGroup title="Evening" slots={groupedSlots.evening} selected={selectedSlot} onSelect={setSelectedSlot} />}
                        
                        {filteredSlots.length === 0 && (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <p className="text-gray-400">No slots available for this date.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-4 border-t">
                        <button
                            onClick={handleProceedToForm}
                            disabled={!selectedSlot}
                            className="w-full bg-[#00838F] text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#006e78] transition-all shadow-lg transform active:scale-[0.99]"
                        >
                            {selectedSlot ? `Confirm Slot: ${selectedSlot}` : "Select a Time Slot"}
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2: Form */}
            {step === "form" && (
                <div className="animate-fade-in">
                    <h2 className="text-center font-bold text-2xl text-[#043953] mb-2">Your Details</h2>
                    <p className="text-center text-gray-500 mb-8 text-sm">Please provide your contact information to secure your slot.</p>
                    
                    <div className="space-y-5 max-w-md mx-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 ml-1">First Name</label>
                                <input
                                    type="text" 
                                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#00838F] outline-none mt-1"
                                    value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 ml-1">Last Name</label>
                                <input
                                    type="text" 
                                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#00838F] outline-none mt-1"
                                    value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 ml-1">Phone Number</label>
                            <div className="flex gap-2 mt-1">
                                <select 
                                    className="w-24 p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none text-sm font-medium"
                                    value={formData.dialCode} onChange={(e) => setFormData({...formData, dialCode: e.target.value})}
                                >
                                    <option value="91">🇮🇳 +91</option>
                                    <option value="1">🇺🇸 +1</option>
                                    <option value="44">🇬🇧 +44</option>
                                </select>
                                <input
                                    type="tel" 
                                    className="flex-1 p-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#00838F] outline-none"
                                    value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 ml-1">Email Address</label>
                            <input
                                type="email" 
                                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#00838F] outline-none mt-1"
                                value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>

                        <div className="pt-8 flex gap-4">
                            <button onClick={() => setStep("slot")} className="w-1/3 bg-white border border-gray-300 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50">
                                Back
                            </button>
                            <button
                                onClick={handleProceedToCheckout}
                                disabled={!formData.firstName || !formData.email || !formData.phone || isLoading}
                                className="flex-1 bg-[#00838F] text-white font-bold py-3 rounded-xl hover:bg-[#006e78] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                            >
                                {isLoading ? "Processing..." : "Proceed to Payment"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: Checkout */}
            {step === "checkout" && cart && (
                <div className="animate-fade-in">
                    <div className="mb-6 pb-4 border-b">
                         <button onClick={() => setStep("form")} className="text-sm text-gray-500 hover:text-[#00838F] flex items-center gap-1 font-medium">
                            <ArrowLeft size={16}/> Edit Details
                         </button>
                    </div>
                    
                    <BookingCheckout 
                        cart={cart}
                        region={region}
                        therapistName="Vikasine Pramodh"
                        refreshCart={async () => {}}
                    />
                </div>
            )}

        </div>
      </div>
    </div>
  )
}