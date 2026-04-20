import Link from 'next/link'

const links = [
  { href: '/',        label: 'Guides'   },
  { href: '/about',   label: 'About'    },
  { href: '/account', label: 'Account'  },
  { href: '/contact', label: 'Contact'  },
]

export function Footer() {
  return (
    <footer className="border-t border-gold/10 px-6 md:px-14 py-12 bg-warm">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">

        {/* Brand */}
        <div className="font-display text-[11px] tracking-[0.4em] uppercase text-mist">
          BRAND NAME
        </div>

        {/* Center — tagline */}
        <div className="font-display text-2xl italic text-gold/60 tracking-wide">
          Live beautifully.
        </div>

        {/* Links */}
        <nav className="flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[9px] tracking-[0.25em] uppercase text-mist opacity-50 hover:opacity-100 hover:text-gold transition-all duration-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Bottom */}
      <div className="mt-8 pt-8 border-t border-gold/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-[9px] tracking-[0.25em] uppercase text-mist opacity-30">
          © {new Date().getFullYear()} BRAND NAME. All rights reserved.
        </p>
        <div className="flex gap-6">
          <Link href="/privacy" className="text-[9px] tracking-[0.2em] uppercase text-mist opacity-30 hover:opacity-60 transition-opacity">
            Privacy
          </Link>
          <Link href="/terms" className="text-[9px] tracking-[0.2em] uppercase text-mist opacity-30 hover:opacity-60 transition-opacity">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  )
}
