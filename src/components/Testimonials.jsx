import { Star, Quote } from 'lucide-react'
import { useHomepageContent } from '../context/HomepageContentContext'

export default function Testimonials() {
  const { testimonials } = useHomepageContent()

  return (
    <section className="section-tint-emerald px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="editorial-section-label">Player stories</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{testimonials.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{testimonials.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {testimonials.items.map(({ name, country, text, rating }, index) => (
            <blockquote
              key={`${name}-${index}`}
              className="editorial-card relative p-6"
            >
              <Quote className="mb-3 h-5 w-5 text-emerald-600/70" aria-hidden="true" />
              <p className="text-sm leading-7 text-slate-700">&ldquo;{text}&rdquo;</p>
              <footer className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">{name}</p>
                  <p className="text-xs text-slate-500">{country}</p>
                </div>
                <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                  ))}
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
