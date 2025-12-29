import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getRegion } from "@lib/data/regions"
import { listProducts } from "@lib/data/products"
import { fetchTherapistSlots } from "@lib/data/external-slots"
import BookingClient from "./booking-client"

export const metadata: Metadata = {
  title: "Book a Session | Medusa Store",
  description: "Schedule your therapy session.",
}

type Props = {
  params: Promise<{ countryCode: string }>
}

export default async function BookingPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  // 1. Fetch Slots
  const slotsData = await fetchTherapistSlots()

  // 2. Fetch a Product to link the payment to
  // Adjust 'limit: 1' or add 'handle: "my-service"' to find the specific product
  const { response } = await listProducts({
    countryCode: params.countryCode,
    queryParams: { limit: 1 }, 
  })
  
  const product = response.products[0]
  
  if (!product || !product.variants?.[0]) {
    return <div>Configuration Error: No service product found in Medusa.</div>
  }

  return (
    <div className="content-container py-12">
      <div className="flex flex-col gap-y-8 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Book Your Session</h1>
          <p className="text-gray-600">Select a date and time to proceed with your booking.</p>
        </div>

        <BookingClient 
          slotsData={slotsData} 
          product={product} 
          variant={product.variants[0]} 
          countryCode={params.countryCode}
          region={region}
        />
      </div>
    </div>
  )
}