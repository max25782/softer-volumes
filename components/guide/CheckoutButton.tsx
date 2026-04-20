'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Guide } from '@/lib/types'

interface CheckoutButtonProps {
  guide: Guide
  variant?: 'outline' | 'gold'
  className?: string
}

export function CheckoutButton({
  guide,
  variant = 'outline',
  className,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guideId: guide.id, guideSlug: guide.slug }),
      })

      if (res.status === 401) {
        // Not logged in — redirect to sign in
        router.push(`/auth/signin?callbackUrl=/guide/${guide.slug}`)
        return
      }

      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Checkout error:', message)
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'gold') {
    return (
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={cn(
          'btn-gold w-full disabled:opacity-60 disabled:cursor-not-allowed',
          className,
        )}
      >
        <span>{loading ? 'Processing…' : `Unlock ${guide.title}`}</span>
        {!loading && <span>→</span>}
        {loading && (
          <span className="w-4 h-4 border border-ink/30 border-t-ink rounded-full animate-spin" />
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={cn(
        'btn-primary disabled:opacity-60 disabled:cursor-not-allowed',
        className,
      )}
    >
      <span>{loading ? 'Processing…' : `Get ${guide.title} Guide`}</span>
      {!loading && <span>→</span>}
      {loading && (
        <span className="w-3 h-3 border border-ink/30 border-t-ink rounded-full animate-spin" />
      )}
    </button>
  )
}
