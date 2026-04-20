import { Reveal } from '@/components/ui'

const testimonials = [
  {
    text: 'The guide changed how I experience Seoul. Every single recommendation was perfect — places I would never have found on my own in years of searching.',
    author: 'Sophia W.',
    location: 'London',
  },
  {
    text: 'Worth every penny and more. The map alone saved me hours of planning. I felt like a local from day one.',
    author: 'Olivia T.',
    location: 'Paris',
  },
  {
    text: 'Beautifully curated with a real point of view. This is not a generic list — it feels personal. Like a friend who actually lives there.',
    author: 'Hugo D.',
    location: 'Amsterdam',
  },
]

export function Testimonials() {
  return (
    <section className="section bg-paper">
      <Reveal className="text-center mb-16">
        <p className="text-eyebrow mb-4">Trusted By</p>
        <h2
          className="font-display font-light"
          style={{ fontSize: 'clamp(36px, 4vw, 56px)' }}
        >
          From discerning<br />
          <em className="text-gold">travellers</em>
        </h2>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((t, i) => (
          <Reveal key={t.author} delay={i as 0 | 1 | 2}>
            <blockquote className="relative p-10 border border-gold/15 h-full">
              {/* Quote mark */}
              <span
                className="absolute top-4 left-8 font-display text-7xl font-light text-gold/20 leading-none select-none"
                aria-hidden
              >
                "
              </span>

              <p className="font-display text-xl font-light italic leading-[1.65] text-charcoal mt-8 mb-8">
                {t.text}
              </p>

              <footer className="pt-5 border-t border-gold/15">
                <p className="text-[9px] tracking-[0.3em] uppercase text-gold">
                  {t.author}
                  <span className="text-mist ml-2">— {t.location}</span>
                </p>
              </footer>
            </blockquote>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
