import { Plus, Trash2 } from 'lucide-react'
import { DEFAULT_HOMEPAGE_CONTENT, normalizeHomepageContent, SOCIAL_PLATFORMS } from '../../data/homepageContent'

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold text-text">{label}</label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, ...props }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded border border-border bg-navy px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
      {...props}
    />
  )
}

function TextArea({ value, onChange, rows = 2, ...props }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full rounded border border-border bg-navy px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
      {...props}
    />
  )
}

function SectionCard({ title, children }) {
  return (
    <section className="rounded-lg border border-border bg-navy-light p-4 sm:p-5">
      <h3 className="mb-4 text-sm font-bold text-accent">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

export default function HomepageContentPanel({
  form,
  setForm,
  onSave,
  saving,
  updatedAt,
}) {
  if (!form) {
    return (
      <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted">
        Loading homepage content…
      </div>
    )
  }

  const patchHero = (key, value) => {
    setForm((prev) => ({ ...prev, hero: { ...prev.hero, [key]: value } }))
  }

  const patchHow = (key, value) => {
    setForm((prev) => ({ ...prev, howItWorks: { ...prev.howItWorks, [key]: value } }))
  }

  const patchFeatures = (key, value) => {
    setForm((prev) => ({ ...prev, features: { ...prev.features, [key]: value } }))
  }

  const patchTestimonials = (key, value) => {
    setForm((prev) => ({ ...prev, testimonials: { ...prev.testimonials, [key]: value } }))
  }

  const patchFaq = (key, value) => {
    setForm((prev) => ({ ...prev, faq: { ...prev.faq, [key]: value } }))
  }

  const patchSeo = (key, value) => {
    setForm((prev) => ({
      ...prev,
      seo: { ...(prev.seo || DEFAULT_HOMEPAGE_CONTENT.seo), [key]: value },
    }))
  }

  const seo = form.seo || DEFAULT_HOMEPAGE_CONTENT.seo

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-navy-light px-4 py-3">
        <div>
          <p className="text-sm font-bold text-text">Homepage Content</p>
          <p className="text-[10px] text-muted">
            {updatedAt
              ? `Last updated ${new Date(updatedAt).toLocaleString()}`
              : 'Edit marketing copy shown on the public homepage'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setForm(normalizeHomepageContent(DEFAULT_HOMEPAGE_CONTENT))}
            className="rounded border border-border px-3 py-2 text-xs font-semibold text-muted hover:text-text"
          >
            Reset defaults
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded bg-accent px-4 py-2 text-xs font-bold text-navy-dark disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Homepage'}
          </button>
        </div>
      </div>

      <SectionCard title="Homepage SEO — Meta Title, Description & Keywords">
        <p className="-mt-2 text-[11px] leading-relaxed text-muted">
          Controls the homepage title, search snippet, keywords, and social preview text (Google, Facebook, WhatsApp link previews).
        </p>
        <Field label="Meta Title">
          <TextInput
            value={seo.metaTitle}
            onChange={(v) => patchSeo('metaTitle', v)}
            maxLength={70}
            placeholder="Page title shown in Google search results"
          />
          <p className="mt-1 text-[10px] text-muted">{(seo.metaTitle || '').length}/70 characters</p>
        </Field>
        <Field label="Meta Description">
          <TextArea
            value={seo.metaDescription}
            onChange={(v) => patchSeo('metaDescription', v)}
            rows={3}
            maxLength={160}
            placeholder="Short summary for search engines and social previews"
          />
          <p className="mt-1 text-[10px] text-muted">{(seo.metaDescription || '').length}/160 characters</p>
        </Field>
        <Field label="Meta Keywords">
          <TextInput
            value={seo.metaKeywords}
            onChange={(v) => patchSeo('metaKeywords', v)}
            placeholder="BpxPro, cricket betting, JazzCash"
          />
          <p className="mt-1 text-[10px] text-muted">Comma-separated keywords for search engines</p>
        </Field>
      </SectionCard>

      <SectionCard title="Hero">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Live badge">
            <TextInput value={form.hero.badgeLive} onChange={(v) => patchHero('badgeLive', v)} />
          </Field>
          <Field label="Countries badge">
            <TextInput value={form.hero.badgeCountries} onChange={(v) => patchHero('badgeCountries', v)} />
          </Field>
          <Field label="Headline prefix">
            <TextInput value={form.hero.headlinePrefix} onChange={(v) => patchHero('headlinePrefix', v)} />
          </Field>
          <Field label="Headline accent">
            <TextInput value={form.hero.headlineAccent} onChange={(v) => patchHero('headlineAccent', v)} />
          </Field>
          <Field label="Subtitle" className="sm:col-span-2">
            <TextArea value={form.hero.subtitle} onChange={(v) => patchHero('subtitle', v)} rows={3} />
          </Field>
          <Field label="CTA — Register with Agent">
            <TextInput value={form.hero.ctaAgent} onChange={(v) => patchHero('ctaAgent', v)} />
          </Field>
          <Field label="CTA — Register Myself">
            <TextInput value={form.hero.ctaSelf} onChange={(v) => patchHero('ctaSelf', v)} />
          </Field>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-text">Highlights</p>
            <button
              type="button"
              onClick={() =>
                patchHero('highlights', [...form.hero.highlights, 'New highlight'])
              }
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {form.hero.highlights.map((item, index) => (
              <div key={index} className="flex gap-2">
                <TextInput
                  value={item}
                  onChange={(v) => {
                    const next = [...form.hero.highlights]
                    next[index] = v
                    patchHero('highlights', next)
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    patchHero(
                      'highlights',
                      form.hero.highlights.filter((_, i) => i !== index),
                    )
                  }
                  className="rounded border border-border px-2 text-muted hover:text-red-400"
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Stats Bar">
        <div className="space-y-3">
          {form.stats.map((stat, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <TextInput
                value={stat.value}
                onChange={(v) => {
                  const next = [...form.stats]
                  next[index] = { ...next[index], value: v }
                  setForm((prev) => ({ ...prev, stats: next }))
                }}
                placeholder="Value"
              />
              <TextInput
                value={stat.label}
                onChange={(v) => {
                  const next = [...form.stats]
                  next[index] = { ...next[index], label: v }
                  setForm((prev) => ({ ...prev, stats: next }))
                }}
                placeholder="Label"
              />
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    stats: prev.stats.filter((_, i) => i !== index),
                  }))
                }
                className="rounded border border-border px-2 text-muted hover:text-red-400"
              >
                <Trash2 className="mx-auto h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                stats: [...prev.stats, { value: '', label: '' }],
              }))
            }
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent"
          >
            <Plus className="h-3.5 w-3.5" /> Add stat
          </button>
        </div>
      </SectionCard>

      <SectionCard title="How It Works">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <TextInput value={form.howItWorks.title} onChange={(v) => patchHow('title', v)} />
          </Field>
          <Field label="Subtitle">
            <TextInput value={form.howItWorks.subtitle} onChange={(v) => patchHow('subtitle', v)} />
          </Field>
        </div>
        <div className="space-y-3">
          {form.howItWorks.steps.map((step, index) => (
            <div key={index} className="rounded border border-border/70 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-muted">Step {index + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    patchHow(
                      'steps',
                      form.howItWorks.steps.filter((_, i) => i !== index),
                    )
                  }
                  className="text-muted hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <TextInput
                value={step.title}
                onChange={(v) => {
                  const next = [...form.howItWorks.steps]
                  next[index] = { ...next[index], title: v }
                  patchHow('steps', next)
                }}
                placeholder="Title"
              />
              <TextArea
                value={step.desc}
                onChange={(v) => {
                  const next = [...form.howItWorks.steps]
                  next[index] = { ...next[index], desc: v }
                  patchHow('steps', next)
                }}
                placeholder="Description"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patchHow('steps', [...form.howItWorks.steps, { title: '', desc: '' }])
            }
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent"
          >
            <Plus className="h-3.5 w-3.5" /> Add step
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Features">
        <Field label="Section title">
          <TextInput value={form.features.title} onChange={(v) => patchFeatures('title', v)} />
        </Field>
        <div className="space-y-3">
          {form.features.items.map((item, index) => (
            <div key={index} className="rounded border border-border/70 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-muted">Feature {index + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    patchFeatures(
                      'items',
                      form.features.items.filter((_, i) => i !== index),
                    )
                  }
                  className="text-muted hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <TextInput
                value={item.title}
                onChange={(v) => {
                  const next = [...form.features.items]
                  next[index] = { ...next[index], title: v }
                  patchFeatures('items', next)
                }}
              />
              <TextArea
                value={item.desc}
                onChange={(v) => {
                  const next = [...form.features.items]
                  next[index] = { ...next[index], desc: v }
                  patchFeatures('items', next)
                }}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patchFeatures('items', [...form.features.items, { title: '', desc: '' }])
            }
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent"
          >
            <Plus className="h-3.5 w-3.5" /> Add feature
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Testimonials">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <TextInput value={form.testimonials.title} onChange={(v) => patchTestimonials('title', v)} />
          </Field>
          <Field label="Subtitle">
            <TextInput value={form.testimonials.subtitle} onChange={(v) => patchTestimonials('subtitle', v)} />
          </Field>
        </div>
        <div className="space-y-3">
          {form.testimonials.items.map((item, index) => (
            <div key={index} className="rounded border border-border/70 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-muted">Review {index + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    patchTestimonials(
                      'items',
                      form.testimonials.items.filter((_, i) => i !== index),
                    )
                  }
                  className="text-muted hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <TextInput
                  value={item.name}
                  onChange={(v) => {
                    const next = [...form.testimonials.items]
                    next[index] = { ...next[index], name: v }
                    patchTestimonials('items', next)
                  }}
                  placeholder="Name"
                />
                <TextInput
                  value={item.country}
                  onChange={(v) => {
                    const next = [...form.testimonials.items]
                    next[index] = { ...next[index], country: v }
                    patchTestimonials('items', next)
                  }}
                  placeholder="Country"
                />
                <TextInput
                  type="number"
                  min={1}
                  max={5}
                  value={item.rating}
                  onChange={(v) => {
                    const next = [...form.testimonials.items]
                    next[index] = { ...next[index], rating: Number(v) || 5 }
                    patchTestimonials('items', next)
                  }}
                  placeholder="Rating"
                />
              </div>
              <TextArea
                value={item.text}
                onChange={(v) => {
                  const next = [...form.testimonials.items]
                  next[index] = { ...next[index], text: v }
                  patchTestimonials('items', next)
                }}
                rows={3}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patchTestimonials('items', [
                ...form.testimonials.items,
                { name: '', country: '', text: '', rating: 5 },
              ])
            }
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent"
          >
            <Plus className="h-3.5 w-3.5" /> Add review
          </button>
        </div>
      </SectionCard>

      <SectionCard title="FAQ">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <TextInput value={form.faq.title} onChange={(v) => patchFaq('title', v)} />
          </Field>
          <Field label="Subtitle">
            <TextInput value={form.faq.subtitle} onChange={(v) => patchFaq('subtitle', v)} />
          </Field>
          <Field label="Support box title">
            <TextInput value={form.faq.supportTitle} onChange={(v) => patchFaq('supportTitle', v)} />
          </Field>
          <Field label="Support CTA">
            <TextInput value={form.faq.supportCta} onChange={(v) => patchFaq('supportCta', v)} />
          </Field>
          <Field label="Support text" className="sm:col-span-2">
            <TextInput value={form.faq.supportText} onChange={(v) => patchFaq('supportText', v)} />
          </Field>
        </div>
        <div className="space-y-3">
          {form.faq.items.map((item, index) => (
            <div key={index} className="rounded border border-border/70 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-muted">Q&A {index + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    patchFaq(
                      'items',
                      form.faq.items.filter((_, i) => i !== index),
                    )
                  }
                  className="text-muted hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <TextInput
                value={item.q}
                onChange={(v) => {
                  const next = [...form.faq.items]
                  next[index] = { ...next[index], q: v }
                  patchFaq('items', next)
                }}
                placeholder="Question"
              />
              <TextArea
                value={item.a}
                onChange={(v) => {
                  const next = [...form.faq.items]
                  next[index] = { ...next[index], a: v }
                  patchFaq('items', next)
                }}
                rows={3}
                placeholder="Answer"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => patchFaq('items', [...form.faq.items, { q: '', a: '' }])}
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent"
          >
            <Plus className="h-3.5 w-3.5" /> Add FAQ
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Footer">
        <Field label="Tagline">
          <TextArea
            value={form.footer.tagline}
            onChange={(v) =>
              setForm((prev) => ({ ...prev, footer: { ...prev.footer, tagline: v } }))
            }
            rows={2}
          />
        </Field>
        <div>
          <p className="mb-3 text-xs font-semibold text-text">Social Media Links</p>
          <p className="mb-4 text-[10px] text-muted">
            Leave blank to hide. Shown in site footer and blog post pages.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {SOCIAL_PLATFORMS.map(({ id, label, placeholder }) => (
              <Field key={id} label={label}>
                <TextInput
                  value={form.footer.social?.[id] ?? ''}
                  onChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      footer: {
                        ...prev.footer,
                        social: {
                          ...(prev.footer?.social || {}),
                          [id]: v,
                        },
                      },
                    }))
                  }
                  placeholder={placeholder}
                  type="url"
                />
              </Field>
            ))}
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end pb-6">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded bg-accent px-5 py-2.5 text-xs font-bold text-navy-dark disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Homepage'}
        </button>
      </div>
    </div>
  )
}
