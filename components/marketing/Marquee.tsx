const items = [
  'Fine Dining',
  'Specialty Coffee',
  'Design Hotels',
  'Hanok Stays',
  'Hidden Bars',
  'Concept Stores',
  'Cultural Spaces',
  'Wellness & Spas',
  'Night Markets',
  'Rooftop Views',
]

export function Marquee() {
  const doubled = [...items, ...items]

  return (
    <div className="w-full overflow-hidden border-y border-gold/15 py-4 bg-warm">
      <div
        className="flex whitespace-nowrap"
        style={{ animation: 'marquee 25s linear infinite' }}
      >
        {doubled.map((item, i) => (
          <div
            key={i}
            className="inline-flex items-center gap-8 px-10"
          >
            <span className="w-1 h-1 rounded-full bg-gold flex-shrink-0" />
            <span className="text-[9px] tracking-[0.35em] uppercase text-mist">
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
