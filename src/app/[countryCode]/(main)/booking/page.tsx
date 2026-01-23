// import { Metadata } from "next"
// import { notFound } from "next/navigation"
// import { getRegion } from "@lib/data/regions"
// import { listProducts } from "@lib/data/products"
// import { fetchTherapistSlots } from "@lib/data/external-slots"
// import BookingClient from "./booking-client"

// export const metadata: Metadata = {
//   title: "Book a Session | Medusa Store",
//   description: "Schedule your therapy session.",
// }

// type Props = {
//   params: Promise<{ countryCode: string }>
// }

// export default async function BookingPage(props: Props) {
//   const params = await props.params
//   console.log("--- DEBUG: Booking Page Loaded ---")
//   console.log("Requested Country:", params.countryCode)

//   const region = await getRegion(params.countryCode)

//   if (!region) {
//     console.error("ERROR: Region not found for code:", params.countryCode)
//     notFound()
//   }
//   console.log("Region Found:", region.name)

//   // 1. Fetch Slots
//   let slotsData = { dates: [], Slots: [] };
//   try {
//     slotsData = await fetchTherapistSlots()
//     console.log("Slots API Response:", JSON.stringify(slotsData, null, 2))
//   } catch (e) {
//     console.error("ERROR: Failed to fetch slots:", e)
//   }

//   // 2. Fetch a Product
//   // We explicitly search for a product that MIGHT have a price.
//   // Ideally, use a handle: listProducts({ countryCode: ..., queryParams: { handle: "consultation" } })
//   const { response } = await listProducts({
//     countryCode: params.countryCode,
//     queryParams: { limit: 1 }, 
//   })
  
//   const product = response.products[0]
  
//   if (!product || !product.variants?.[0]) {
//     console.error("ERROR: No products found. Check if products have INR prices in Admin.")
//     return (
//       <div className="py-24 text-center">
//         <h1 className="text-2xl font-bold text-red-600">Configuration Error</h1>
//         <p>No products found for {region.name}.</p>
//         <p className="text-sm text-gray-500 mt-2">
//           Tip: Go to Medusa Admin -> Products -> Edit Variant -> Add Price for INR.
//         </p>
//       </div>
//     )
//   }

//   console.log("Product Found:", product.title)

//   return (
//     <div className="content-container py-12">
//       <div className="flex flex-col gap-y-8 max-w-4xl mx-auto">
//         <div className="text-center">
//           <h1 className="text-3xl font-bold mb-2">Book Your Session</h1>
//           <p className="text-gray-600">Select a date and time to proceed with your booking.</p>
//         </div>

//         <BookingClient 
//           slotsData={slotsData} 
//           product={product} 
//           variant={product.variants[0]} 
//           countryCode={params.countryCode}
//           region={region}
//         />
//       </div>
//     </div>
//   )
// }


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
  let slotsData = { dates: [], Slots: [] };
  try {
    slotsData = await fetchTherapistSlots()
  } catch (e) {
    console.error("Failed to fetch slots:", e)
  }

  // 2. Fetch Product
  const { response } = await listProducts({
    countryCode: params.countryCode,
    queryParams: { limit: 1 }, 
  })
  
  const product = response.products[0]
  
  if (!product || !product.variants?.[0]) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-2xl font-bold text-red-600">Configuration Error</h1>
        <p>No products found for {region.name}. Check Medusa Admin.</p>
      </div>
    )
  }

  return (
    <div className="content-container py-12 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
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