import { Cormorant_Garamond, Josefin_Sans, Noto_Serif_KR } from 'next/font/google'

export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
  preload: true,
})

export const josefin = Josefin_Sans({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '600'],
  variable: '--font-josefin',
  display: 'swap',
  preload: true,
})

export const notoKr = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-noto-kr',
  display: 'swap',
  preload: false,
})
