"use client"

import { useState, useMemo } from "react"
import { Button, Heading, Text, clx, Container } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import BookingCheckout from "./booking-checkout" 
import { User } from "@medusajs/icons" // Import an icon for visual flair

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

// 1. Define Available Therapists (Matching your backend logic)
const THERAPISTS = [
  { 
    id: "10", 
    name: "Dr. Standard", 
    specialty: "General Therapy", 
    price: 1000 
  },
  { 
    id: "11", 
    name: "Dr. Specialist", 
    specialty: "Advanced Care", 
    price: 2000 // Backend logic: if id === "11", price is 2000
  }
]

export default function BookingClient({ 
  slotsData, 
  product, 
  variant, 
  countryCode, 
  region,
}: BookingClientProps) {
  
  // 2. Add State for Selected Therapist (Default to first one)
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>(THERAPISTS[0].id)
  
  const [selectedDate, setSelectedDate] = useState<string>(slotsData.dates[0])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  // Filter slots for the selected date
  const availableTimeSlots = useMemo(() => {
    return slotsData.Slots.filter(slot => slot.startsWith(selectedDate))
      .map(slot => {
        const timePart = slot.split(" ")[1] 
        return {
          full: slot,
          display: timePart.slice(0, 5) 
        }
      })
  }, [selectedDate, slotsData.Slots])

  const handleBookClick = () => {
    if (selectedSlot) {
      setIsCheckoutOpen(true)
    }
  }

  // Helper to get current therapist details
  const currentTherapist = THERAPISTS.find(t => t.id === selectedTherapistId)

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      
      {/* --- NEW SECTION: Therapist Selection --- */}
      <div className="mb-8">
        <Heading level="h2" className="text-lg mb-4">1. Choose your Therapist</Heading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {THERAPISTS.map((therapist) => (
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
                  {therapist.price} {region.currency_code.toUpperCase()}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* ---------------------------------------- */}

      {/* 2. Date Selector (Updated heading number) */}
      <div className="mb-8">
        <Heading level="h2" className="text-lg mb-4">2. Select Date</Heading>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {slotsData.dates.map((date) => (
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

      {/* 3. Time Slot Grid (Updated heading number) */}
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

      {/* 4. Action Button */}
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
          Book for {currentTherapist?.price} {region.currency_code.toUpperCase()}
        </Button>
      </div>

      {/* 5. Pass selectedTherapistId to Checkout */}
     {isCheckoutOpen && selectedSlot && (
        <BookingCheckout 
          product={product}
          variant={variant}
          countryCode={countryCode}
          region={region}
          slot={selectedSlot}
          therapistId={selectedTherapistId} // <--- UPDATED: Passing dynamic ID
          close={() => setIsCheckoutOpen(false)}
        />
      )}
    </div>
  )
}