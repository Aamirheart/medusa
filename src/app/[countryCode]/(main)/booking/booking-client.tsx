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

// 1. Define Therapist Data locally or fetch it. 
// For now, matching your UI, we assume this is the active therapist.
const ACTIVE_THERAPIST = {
    id: "10",
    name: "Dr. Aamir (Standard)",
    title: "Individual Therapy",
    image: "/demoimg.png"
}

// ... (TherapistCard, SlotGroup, getDayDate components remain the same as previous) ...
function TherapistCard() {
  return (
    <div className="bg-[#EAF7FC] rounded-[30px] md:rounded-[51.669px] shadow-[0_0_28.183px_rgba(0,0,0,0.25)] mb-8 overflow-hidden">
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="relative shrink-0">
             <div className="w-[120px] h-[120px] md:w-[200px] md:h-[200px] rounded-full md:rounded-2xl overflow-hidden bg-gray-200 border-4 border-white shadow-sm">
                <Image
                    src={ACTIVE_THERAPIST.image}
                    alt="Therapist"
                    width={200}
                    height={200}
                    className="object-cover w-full h-full"
                />
             </div>
          </div>
          <div className="flex-grow text-center md:text-left space-y-2">
             <div>
                <p className="text-lg md:text-2xl font-medium text-gray-600">{ACTIVE_THERAPIST.title}</p>
                <h2 className="text-2xl md:text-4xl font-extrabold text-[#00838F]">{ACTIVE_THERAPIST.name}</h2>
             </div>
             {/* ... Ratings ... */}
             <div className="flex flex-col md:flex-row gap-2 md:gap-6 text-sm md:text-lg text-gray-700 justify-center md:justify-start">
                <p><b>⭐ Rating:</b> 4.9/5</p>
                <p><b>👍 Recommended By:</b> 500+ Clients</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ... (SlotGroup component remains the same) ...
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
            <p className="font-bold text-[#043953] mb-3 text-lg">{title}</p>
            <div className="flex flex-wrap gap-3">
                {slots.map((slot) => (
                    <button
                        key={slot}
                        onClick={() => onSelect(slot)}
                        className={`rounded-xl px-5 py-3 text-sm md:text-base font-medium transition-all duration-200 border
                          ${selected === slot
                                ? "bg-[#E5F7F9] border-[#00838F] text-[#00838F] shadow-md scale-105"
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

// ... (getDayDate helper remains the same) ...
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

  const [step, setStep] = useState<"slot" | "form" | "checkout">("slot")
  const [selectedDate, setSelectedDate] = useState<string>(slotsData.dates[0] || "")
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [formData, setFormData] = useState({ firstName: "", lastName: "", phone: "", email: "", dialCode: "91" })
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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

  const handleProceedToForm = () => { if (selectedSlot) setStep("form") }

  const handleProceedToCheckout = async () => {
    if (!selectedSlot) return
    setIsLoading(true)
    try {
        const apiCountryCode = countryCode 
        
        // 1. Create Cart with Therapist ID
        const newCart = await createCustomTherapistCart({
            variantId: variant.id,
            quantity: 1,
            countryCode: apiCountryCode, 
            therapistId: ACTIVE_THERAPIST.id,
            slot: `${selectedDate} ${selectedSlot}`
        })

        if (!newCart) throw new Error("Failed to create cart")

        // 2. Update with User Details
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
    <div className="pb-20">
      <TherapistCard />

      <div className="bg-white rounded-[30px] md:rounded-[51px] shadow-[0_0_12px_rgba(0,0,0,0.15)] p-6 md:p-8 relative min-h-[400px]">
        
        {step === "slot" && (
            <div className="animate-fade-in">
                {/* Date Swiper */}
                <div className="flex items-center gap-2 mb-8">
                    <button className="swiper-prev-custom w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 text-[#043953] font-bold">&lt;</button>
                    <Swiper
                        modules={[Navigation]}
                        navigation={{ prevEl: ".swiper-prev-custom", nextEl: ".swiper-next-custom" }}
                        breakpoints={{
                            0: { slidesPerView: 3, spaceBetween: 10 },
                            768: { slidesPerView: 5, spaceBetween: 15 },
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
                                        className={`w-full rounded-xl py-3 px-2 border transition-all duration-200 flex flex-col items-center justify-center
                                            ${isActive 
                                                ? "bg-[#E5F7F9] border-[#00838F] text-[#00838F] shadow-md scale-105" 
                                                : "bg-white border-gray-200 text-gray-500 hover:border-[#00838F]"
                                            }`}
                                    >
                                        <span className="text-xs font-medium">{day}</span>
                                        <span className="text-sm font-bold">{month} {dNum}</span>
                                    </button>
                                </SwiperSlide>
                            )
                        })}
                    </Swiper>
                    <button className="swiper-next-custom w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 text-[#043953] font-bold">&gt;</button>
                </div>

                {/* Slots */}
                <div className="space-y-6 min-h-[200px]">
                    {groupedSlots.morning.length > 0 && <SlotGroup title="Morning Slots" slots={groupedSlots.morning} selected={selectedSlot} onSelect={setSelectedSlot} />}
                    {groupedSlots.afternoon.length > 0 && <SlotGroup title="Afternoon Slots" slots={groupedSlots.afternoon} selected={selectedSlot} onSelect={setSelectedSlot} />}
                    {groupedSlots.evening.length > 0 && <SlotGroup title="Evening Slots" slots={groupedSlots.evening} selected={selectedSlot} onSelect={setSelectedSlot} />}
                    {filteredSlots.length === 0 && <p className="text-center text-gray-500 py-10">No slots available for this date.</p>}
                </div>

                <div className="mt-8">
                    <button
                        onClick={handleProceedToForm}
                        disabled={!selectedSlot}
                        className="w-full bg-[#01818C] text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 hover:bg-[#016f78] transition-colors shadow-lg"
                    >
                        {selectedSlot ? `Confirm Slot: ${selectedSlot}` : "Select a Time Slot"}
                    </button>
                </div>
            </div>
        )}

        {step === "form" && (
            <div className="animate-fade-in max-w-lg mx-auto">
                <h2 className="text-center font-bold text-2xl text-[#043953] mb-6">Enter Details</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text" placeholder="First Name"
                            className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#00838F] outline-none"
                            value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        />
                        <input
                            type="text" placeholder="Last Name"
                            className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#00838F] outline-none"
                            value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        />
                    </div>
                    <div className="flex gap-2">
                         <select 
                            className="w-28 p-4 rounded-xl bg-gray-50 border border-gray-200 outline-none text-sm"
                            value={formData.dialCode} onChange={(e) => setFormData({...formData, dialCode: e.target.value})}
                         >
                            <option value="91">IN (+91)</option>
                            <option value="1">US (+1)</option>
                         </select>
                         <input
                            type="tel" placeholder="Phone Number"
                            className="flex-1 p-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#00838F] outline-none"
                            value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                         />
                    </div>
                    <input
                        type="email" placeholder="Email Address"
                        className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#00838F] outline-none"
                        value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                    <div className="pt-6 flex gap-4">
                        <button onClick={() => setStep("slot")} className="w-1/3 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200">
                            Back
                        </button>
                        <button
                            onClick={handleProceedToCheckout}
                            disabled={!formData.firstName || !formData.email || !formData.phone || isLoading}
                            className="flex-1 bg-[#01818C] text-white font-bold py-3 rounded-xl hover:bg-[#016f78] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? "Processing..." : "Proceed to Payment →"}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {step === "checkout" && cart && (
            <div className="animate-fade-in">
                <div className="mb-4">
                     <button onClick={() => setStep("form")} className="text-sm text-gray-500 hover:text-[#00838F] underline">← Back to Details</button>
                </div>
                <h2 className="text-2xl font-bold text-[#043953] mb-6">Review & Pay</h2>
                
                {/* Pass the ACTIVE_THERAPIST name here */}
                <BookingCheckout 
                    cart={cart}
                    region={region}
                    therapistName={ACTIVE_THERAPIST.name}
                    refreshCart={async () => {}}
                />
            </div>
        )}
      </div>
    </div>
  )
}