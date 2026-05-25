import { NextResponse } from 'next/server'
import { getAppBaseUrl } from '@/lib/app-url'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, getCompletedPayPalCapture } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'

export async function GET(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')
  const guideSlug = url.searchParams.get('guideSlug') ?? ''
  const origin = getAppBaseUrl()

  if (!session?.user?.id || !orderId) {
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const completedCapture = getCompletedPayPalCapture(capture)

    if (completedCapture === null || completedCapture.userId !== session.user.id) {
      return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
    }

    const purchase = await recordCompletedPurchase({
      ...completedCapture,
      provider: 'paypal',
    })

    return NextResponse.redirect(`${origin}/guides/${purchase.guide.slug}?paypal=success`)
  } catch (error) {
    console.error('PayPal return fulfillment failed:', error)
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }
}
