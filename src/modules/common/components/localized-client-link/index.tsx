"use client"

import Link from "next/link"
import React from "react"

/**
 * Updated to NOT prepend country code. 
 * The middleware will handle rewriting the request to the correct region.
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: any
}) => {
  // We simply pass the href through. 
  // e.g., href="/booking" remains "/booking".
  // The middleware will detect the user's region and rewrite it internally to "/in/booking".
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink