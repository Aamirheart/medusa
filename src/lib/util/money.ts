import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = "en-US",
}: ConvertToLocaleParams) => {
  return currency_code && !isEmpty(currency_code)
    ? new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency_code,
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(amount)
    : amount.toString()
}

type FormatAmountParams = {
  amount: number
  region: { currency_code: string; tax_rate?: number; tax_code?: string }
  includeTaxes?: boolean
  locale?: string
}

export const formatAmount = ({
  amount,
  region,
  includeTaxes = true,
  locale = "en-US",
}: FormatAmountParams) => {
  if (!region) {
    return convertToLocale({ amount, currency_code: "USD", locale })
  }

  // Medusa amounts are usually in the smallest unit (e.g., cents).
  // We divide by 100 to get the main currency unit. 
  // (Note: For currencies like JPY that don't use cents, you might need conditional logic here)
  const val = amount / 100

  return convertToLocale({
    amount: val,
    currency_code: region.currency_code,
    locale,
  })
}