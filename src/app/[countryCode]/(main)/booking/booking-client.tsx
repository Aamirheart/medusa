"use client"

import { useState, useMemo } from "react"
import { Button, Heading, Text, clx } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import BookingCheckout from "./booking-checkout"
import { User } from "@medusajs/icons"

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

// 1. Define Therapists with Multipliers
const THERAPISTS = [
  { 
    id: "10", 
    name: "Dr. Aamir (Standard)", 
    specialty: "General Therapy", 
    multiplier: 1 // Pays Base Price (e.g., 1000 INR)
  },
  { 
    id: "11", 
    name: "Dr. Sarah (Specialist)", 
    specialty: "Advanced Care", 
    multiplier: 2 // Pays 2x Base Price (e.g., 2000 INR)
  }
]

export default function BookingClient({ 
  slotsData, 
  product, 
  variant, 
  countryCode, 
  region,
}: BookingClientProps) {
  
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>(THERAPISTS[0].id)
  const [selectedDate, setSelectedDate] = useState<string>(slotsData?.dates?.[0] || "")
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  // 1. CLEAN URL LOGIC
  // If we are in "in" (India), keep the URL clean (empty string). 
  // Else use the country code (e.g. "us").
  const cleanCountryCode = countryCode === "in" ? "" : countryCode

  // 2. PRICING LOGIC
  // Medusa has already given us the correct price for this Region (INR or USD).
  const basePrice = variant?.calculated_price?.calculated_amount || 0
  
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: region?.currency_code?.toUpperCase() || "INR",
    }).format(amount)
  }

  // Filter slots for the selected date
  const availableTimeSlots = useMemo(() => {
    if (!slotsData?.Slots) return []
    
    return slotsData.Slots.filter(slot => slot.startsWith(selectedDate))
      .map(slot => {
        const timePart = slot.split(" ")[1] 
        return {
          full: slot,
          display: timePart.slice(0, 5) 
        }
      })
  }, [selectedDate, slotsData])

  const handleBookClick = () => {
    if (selectedSlot) {
      setIsCheckoutOpen(true)
    }
  }

  const currentTherapist = THERAPISTS.find(t => t.id === selectedTherapistId)
  // Calculate price: Base Region Price * Therapist Multiplier
  const currentPrice = basePrice * (currentTherapist?.multiplier || 1)

  // Safety Check
  if (!product || !region) {
    return (
      <div className="p-8 text-center border rounded-lg bg-gray-50">
        <Heading level="h2" className="text-red-500">Configuration Error</Heading>
        <Text>Product or Region not found. Please check Medusa Admin.</Text>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      
      {/* SECTION 1: Therapist Selection */}
      <div className="mb-8">
        <Heading level="h2" className="text-lg mb-4">1. Choose your Therapist</Heading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {THERAPISTS.map((therapist) => {
            const price = basePrice * therapist.multiplier

            return (
              <div 
                key={therapist.id}
                onClick={() => setSelectedTherapistId(therapist.id)}
                className={clx(
                  "cursor-pointer p-4 rounded-lg border transition-all flex items-start gap-4",
                  selectedTherapistId === therapist.id
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                <div className={clx(
                  "p-2 rounded-full",
                  selectedTherapistId === therapist.id ? "bg-blue-200 text-blue-700" : "bg-gray-100 text-gray-500"
                )}>
                  <User />
                </div>
                <div>
                  <Text className="font-bold text-base">{therapist.name}</Text>
                  <Text className="text-sm text-gray-500">{therapist.specialty}</Text>
                  <Text className="text-sm font-medium mt-1">
                    {formatPrice(price)}
                  </Text>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION 2: Date Selector */}
      <div className="mb-8">
        <Heading level="h2" className="text-lg mb-4">2. Select Date</Heading>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {slotsData?.dates?.map((date) => (
            <button
              key={date}
              onClick={() => {
                setSelectedDate(date)
                setSelectedSlot(null)
              }}
              className={clx(
                "px-4 py-3 rounded-md border min-w-[100px] transition-all text-sm font-medium whitespace-nowrap",
                selectedDate === date
                  ? "border-black bg-black text-white shadow-md"
                  : "border-gray-200 hover:border-gray-400 text-gray-700 bg-gray-50"
              )}
            >
              {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 3: Time Slot Grid */}
      <div className="mb-8">
        <Heading level="h2" className="text-lg mb-4">3. Select Time</Heading>
        
        {availableTimeSlots.length === 0 ? (
          <Text className="text-gray-500 italic">No slots available for this date.</Text>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {availableTimeSlots.map(({ full, display }) => (
              <button
                key={full}
                onClick={() => setSelectedSlot(full)}
                className={clx(
                  "py-2 px-3 rounded-md text-sm border transition-all",
                  selectedSlot === full
                    ? "border-blue-600 bg-blue-50 text-blue-700 font-bold ring-1 ring-blue-600"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                )}
              >
                {display}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: Action Button */}
      <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
         <div className="text-sm text-gray-600">
            Summary: <span className="font-bold text-black">{currentTherapist?.name}</span> @ {selectedSlot ? selectedSlot : "..."}
         </div>

        <Button 
          variant="primary" 
          size="large" 
          disabled={!selectedSlot}
          onClick={handleBookClick}
          className="w-full sm:w-auto"
        >
          Book for {formatPrice(currentPrice)}
        </Button>
      </div>

      {/* SECTION 5: Checkout Modal */}
      {isCheckoutOpen && selectedSlot && (
        <BookingCheckout 
          product={product}
          variant={variant}
          countryCode={cleanCountryCode} // PASSING CLEAN CODE (empty string for IN)
          region={region}
          slot={selectedSlot}
          therapistId={selectedTherapistId}
          close={() => setIsCheckoutOpen(false)}
        />
      )}
    </div>
  )
}