import { Heading, Text, Container } from "@medusajs/ui"
import { cookies as nextCookies } from "next/headers"
import { CheckCircleSolid } from "@medusajs/icons"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  return (
    <div className="py-12 min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-3xl mx-auto h-full w-full">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        
        {/* Success Header Card */}
        <div className="flex flex-col items-center justify-center text-center gap-4 bg-white p-8 rounded-lg border border-gray-200 shadow-sm w-full">
            <CheckCircleSolid className="w-12 h-12 text-green-500" />
            <Heading
                level="h1"
                className="text-3xl font-serif text-gray-900"
            >
                Thank you, your order is confirmed!
            </Heading>
            <Text className="text-gray-500 max-w-md">
                We have received your appointment booking. A confirmation email has been sent to your inbox.
            </Text>
            <div className="w-full h-px bg-gray-100 my-4" />
            <OrderDetails order={order} />
        </div>

        {/* Order Summary Section */}
        <div
          className="flex flex-col gap-4 max-w-3xl h-full bg-white w-full p-8 rounded-lg border border-gray-200 shadow-sm"
          data-testid="order-complete-container"
        >
          <Heading level="h2" className="text-xl mb-4 border-b border-gray-200 pb-4">
            Booking Summary
          </Heading>
          
          <Items order={order} />
          
          <div className="mt-4">
             <CartTotals totals={order} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 border-t border-gray-200 pt-8">
             <ShippingDetails order={order} />
             <PaymentDetails order={order} />
          </div>

          <div className="mt-8 border-t border-gray-200 pt-8">
             <Help />
          </div>
        </div>
      </div>
    </div>
  )
}