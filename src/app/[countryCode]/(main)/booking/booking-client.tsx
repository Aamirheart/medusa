"use client"

import { useState, useMemo } from "react"
import { Button, Heading, Text, clx } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
// --- CHANGE HERE: Import the new component ---
import BookingCheckout from "./booking-checkout" 

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

export default function BookingClient({ 
  slotsData, 
  product, 
  variant, 
  countryCode, 
  region 
}: BookingClientProps) {
  const [selectedDate, setSelectedDate] = useState<string>(slotsData.dates[0])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  // Filter slots for the selected date
  const availableTimeSlots = useMemo(() => {
    return slotsData.Slots.filter(slot => slot.startsWith(selectedDate))
      .map(slot => {
        const timePart = slot.split(" ")[1] // "13:00:00"
        return {
          full: slot,
          display: timePart.slice(0, 5) // "13:00"
        }
      })
  }, [selectedDate, slotsData.Slots])

  const handleBookClick = () => {
    if (selectedSlot) {
      setIsCheckoutOpen(true)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      
      {/* 1. Date Selector */}
      <div className="mb-8">
        <Heading level="h2" className="text-lg mb-4">1. Select Date</Heading>
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

      {/* 2. Time Slot Grid */}
      <div className="mb-8">
        <Heading level="h2" className="text-lg mb-4">2. Select Time</Heading>
        
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

      {/* 3. Action Button */}
      <div className="border-t pt-6 flex justify-end">
        <Button 
          variant="primary" 
          size="large" 
          disabled={!selectedSlot}
          onClick={handleBookClick}
          className="w-full sm:w-auto"
        >
          Book Selected Slot
        </Button>
      </div>

      {/* 4. Use the new BookingCheckout Component */}
      {isCheckoutOpen && selectedSlot && (
        <BookingCheckout 
          product={product}
          variant={variant}
          countryCode={countryCode}
          region={region}
          slot={selectedSlot}
          close={() => setIsCheckoutOpen(false)}
        />
      )}
    </div>
  )
}