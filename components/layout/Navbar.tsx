'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/',        label: 'Guides'  },
  { href: '/about',   label: 'About'   },
  { href: '/account', label: 'Account' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'flex items-center justify-between',
        'px-6 md:px-14 py-6 md:py-8',
      )}
    >
      {/* Gradient fade */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(244,239,229,0.97) 0%, transparent 100%)',
        }}
      />

      {/* Logo */}
      <Link
        href="/"
        className="relative font-display text-[13px] font-normal tracking-[0.3em] uppercase text-ink hover:text-gold transition-colors duration-300"
      >
        BRAND NAME
      </Link>

      {/* Nav links — hidden on mobile */}
      <nav className="hidden md:flex items-center gap-10 relative">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'text-eyebrow transition-opacity duration-300',
              pathname === link.href
                ? 'text-gold opacity-100'
                : 'text-charcoal opacity-60 hover:opacity-100'
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Mobile menu button */}
      <button
        className="relative md:hidden flex flex-col gap-[5px] p-2"
        aria-label="Menu"
      >
        <span className="w-5 h-px bg-ink block" />
        <span className="w-3 h-px bg-gold block" />
      </button>
    </header>
  )
}
