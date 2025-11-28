'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImageWithFallbackProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
}

export function ImageWithFallback({
  src,
  alt = 'Product image',
  fill = false,
  className = '',
  sizes,
  priority = false,
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false)

  const imageProps = {
    src: error ? '/images/products/placeholder.svg' : src,
    alt,
    fill,
    className,
    sizes,
    priority,
    onError: () => setError(true),
    loading: (priority ? 'eager' : 'lazy') as 'eager' | 'lazy',
    quality: 75,
    ...(fill ? {} : { width: 640, height: 640 }),
  }

  return <Image {...imageProps} alt={alt || ''} />
}