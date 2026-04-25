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
  const [loadingProvider, setLoadingProvider] = useState<'stripe' | 'paypal' | null>(null)
  const router = useRouter()

  async function handleCheckout(provider: 'stripe' | 'paypal') {
    setLoadingProvider(provider)
    try {
      const res = await fetch(provider === 'stripe' ? '/api/checkout' : '/api/checkout/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guideId: guide.id, guideSlug: guide.slug }),
      })

      if (res.status === 401) {
        // Not logged in — redirect to sign in
        router.push(`/auth/signin?callbackUrl=/guide/${guide.slug}`)
        return
      }

      const data = (await res.json()) as { url?: string; approvalUrl?: string }
      const url = data.url ?? data.approvalUrl
      if (url) window.location.href = url
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Checkout error:', message)
    } finally {
      setLoadingProvider(null)
    }
  }

  const isLoading = loadingProvider !== null

  if (variant === 'gold') {
    return (
      <div className={cn('grid gap-3', className)}>
        <button
          onClick={() => handleCheckout('stripe')}
          disabled={isLoading}
          className="btn-gold w-full disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span>{loadingProvider === 'stripe' ? 'Processing…' : `Unlock ${guide.title}`}</span>
          {loadingProvider !== 'stripe' && <span>→</span>}
          {loadingProvider === 'stripe' && (
            <span className="w-4 h-4 border border-ink/30 border-t-ink rounded-full animate-spin" />
          )}
        </button>
        <button
          onClick={() => handleCheckout('paypal')}
          disabled={isLoading}
          className="border border-gold/40 px-6 py-4 text-[10px] uppercase tracking-[0.3em] text-ink disabled:opacity-60"
        >
          {loadingProvider === 'paypal' ? 'Opening PayPal…' : 'Pay with PayPal'}
        </button>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      <button
        onClick={() => handleCheckout('stripe')}
        disabled={isLoading}
        className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span>{loadingProvider === 'stripe' ? 'Processing…' : `Get ${guide.title} Guide`}</span>
        {loadingProvider !== 'stripe' && <span>→</span>}
        {loadingProvider === 'stripe' && (
          <span className="w-3 h-3 border border-ink/30 border-t-ink rounded-full animate-spin" />
        )}
      </button>
      <button
        onClick={() => handleCheckout('paypal')}
        disabled={isLoading}
        className="border border-gold/30 px-6 py-4 text-[9px] uppercase tracking-[0.3em] text-gold disabled:opacity-60"
      >
        {loadingProvider === 'paypal' ? 'Opening PayPal…' : 'PayPal'}
      </button>
    </div>
  )
}
