"use client"

import { Table, Text, clx } from "@medusajs/ui"
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import { useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  // Define logic for max quantity (default to 10 if not managed)
  const maxQtyFromInventory = 10
  const maxQuantity = item.variant?.manage_inventory ? 10 : maxQtyFromInventory

  // FIX: Safely access metadata by casting it
  const metadata = (item.metadata as Record<string, any>) || {}
  const hasBookingData = metadata.appointment_slot || metadata.therapist_id

  return (
    <Table.Row className="w-full border-b border-gray-100 last:border-0" data-testid="product-row">
      
      {/* SECTION 1: Product Info & Booking Details */}
      <Table.Cell className="text-left align-top py-4 pl-0">
        <div className="flex flex-col gap-y-2">
          <LocalizedClientLink
            href={`/products/${item.product_handle}`}
          >
            <Text
              className="txt-medium-plus text-ui-fg-base font-semibold hover:text-ui-fg-interactive"
              data-testid="product-title"
            >
              {item.product_title}
            </Text>
          </LocalizedClientLink>
          
          <LineItemOptions variant={item.variant} data-testid="product-variant" />

          {/* --- CUSTOM BOOKING DETAILS BOX --- */}
          {hasBookingData && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200 w-full max-w-[350px]">
              <Text className="txt-small-plus text-gray-900 mb-2 pb-1 border-b border-gray-200">
                Appointment Details
              </Text>
              <div className="flex flex-col gap-y-1.5">
                {metadata.appointment_slot && (
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>Time Slot:</span>
                    <span className="font-medium text-gray-900">
                      {String(metadata.appointment_slot)}
                    </span>
                  </div>
                )}
                {metadata.therapist_id && (
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>Therapist ID:</span>
                    <span className="font-medium text-gray-900">
                      {String(metadata.therapist_id)}
                    </span>
                  </div>
                )}
                {metadata.service_id && (
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>Service ID:</span>
                    <span className="font-medium text-gray-900">
                      {String(metadata.service_id)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Table.Cell>

      {/* SECTION 2: Interactive Actions (Quantity & Delete) */}
      {type === "full" && (
        <Table.Cell className="align-top py-4">
          <div className="flex gap-2 items-center justify-start">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
            <CartItemSelect
              value={item.quantity}
              onChange={(value) => changeQuantity(parseInt(value.target.value))}
              className="w-14 h-10 p-2.5"
              data-testid="product-select-button"
            >
              {Array.from(
                {
                  length: Math.min(maxQuantity, 10),
                },
                (_, i) => (
                  <option value={i + 1} key={i}>
                    {i + 1}
                  </option>
                )
              )}
            </CartItemSelect>
            {updating && <Spinner />}
          </div>
          <ErrorMessage error={error} data-testid="product-error-message" />
        </Table.Cell>
      )}

      {/* SECTION 3: Unit Price (Hidden on mobile) */}
      {type === "full" && (
        <Table.Cell className="hidden small:table-cell align-top py-4">
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </Table.Cell>
      )}

      {/* SECTION 4: Total Price */}
      <Table.Cell className="!pr-0 align-top py-4 text-right">
        <span
          className={clx("!pr-0", {
            "flex flex-col items-end h-full justify-center": type === "preview",
          })}
        >
          {type === "preview" && (
            <span className="flex gap-x-1 ">
              <Text className="text-ui-fg-muted">{item.quantity}x </Text>
              <LineItemUnitPrice
                item={item}
                style="tight"
                currencyCode={currencyCode}
              />
            </span>
          )}
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item