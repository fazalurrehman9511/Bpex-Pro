import { Star, Quote } from 'lucide-react'

const reviews = [
  {
    name: 'Ahmed K.',
    country: '🇵🇰 Pakistan',
    text: 'Best agent in Karachi. JazzCash deposit in 2 minutes, withdrawal same day. Highly recommended!',
    rating: 5,
  },
  {
    name: 'Rajesh M.',
    country: '🇮🇳 India',
    text: 'Cricket odds are always better than others. Agent replies instantly on WhatsApp even at 2 AM.',
    rating: 5,
  },
  {
    name: 'Omar H.',
    country: '🇦🇪 UAE',
    text: 'Professional service. Bank transfer deposit was smooth. Been using BpxPro for 2 years now.',
    rating: 5,
  },
]

export default function Testimonials() {
  return (
    <section className="hex-pattern px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-1 text-base font-bold text-slate-800 sm:text-lg">What Players Say</h2>
        <p className="mb-5 text-xs text-slate-500">Trusted by thousands across 6 countries</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {reviews.map(({ name, country, text, rating }) => (
            <div
              key={name}
              className="rounded border border-slate-200 bg-white p-4 shadow-sm"
            >
              <Quote className="h-4 w-4 text-accent mb-2" />
              <p className="text-xs leading-relaxed text-slate-600">{text}</p>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">{name}</p>
                  <p className="text-[10px] text-slate-400">{country}</p>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-accent text-accent" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
