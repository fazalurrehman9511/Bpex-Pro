import { Plus, Trash2 } from 'lucide-react'
import { DEFAULT_BRAND_GUIDE_CONTENT, normalizeBrandGuideContent } from '../../data/brandGuideContent'

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

export default function BrandGuideContentPanel({
  form,
  setForm,
  onSave,
  saving,
  updatedAt,
}) {
  if (!form) {
    return (
      <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted">
        Loading brand guide content…
      </div>
    )
  }

  const seo = form.seo || DEFAULT_BRAND_GUIDE_CONTENT.seo
  const hero = form.hero || DEFAULT_BRAND_GUIDE_CONTENT.hero
  const platform = form.platform || DEFAULT_BRAND_GUIDE_CONTENT.platform
  const links = form.links || DEFAULT_BRAND_GUIDE_CONTENT.links

  const patchSeo = (key, value) => {
    setForm((prev) => ({
      ...prev,
      seo: { ...(prev.seo || DEFAULT_BRAND_GUIDE_CONTENT.seo), [key]: value },
    }))
  }

  const patchHero = (key, value) => {
    setForm((prev) => ({
      ...prev,
      hero: { ...(prev.hero || DEFAULT_BRAND_GUIDE_CONTENT.hero), [key]: value },
    }))
  }

  const patchPlatform = (key, value) => {
    setForm((prev) => ({
      ...prev,
      platform: { ...(prev.platform || DEFAULT_BRAND_GUIDE_CONTENT.platform), [key]: value },
    }))
  }

  const patchLinks = (key, value) => {
    setForm((prev) => ({
      ...prev,
      links: { ...(prev.links || DEFAULT_BRAND_GUIDE_CONTENT.links), [key]: value },
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-navy-light px-4 py-3">
        <div>
          <p className="text-sm font-bold text-text">Brand Guide Page (/bpx)</p>
          <p className="text-[10px] text-muted">
            {updatedAt
              ? `Last updated ${new Date(updatedAt).toLocaleString()}`
              : 'Edit the official brand guide landing page'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setForm(normalizeBrandGuideContent(DEFAULT_BRAND_GUIDE_CONTENT))}
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
            {saving ? 'Saving…' : 'Save Brand Guide'}
          </button>
        </div>
      </div>

      <SectionCard title="SEO — Meta Title, Description & Keywords">
        <p className="-mt-2 text-[11px] leading-relaxed text-muted">
          Controls search and social preview for the /bpx brand guide page.
        </p>
        <Field label="Meta Title">
          <TextInput
            value={seo.metaTitle}
            onChange={(v) => patchSeo('metaTitle', v)}
            maxLength={70}
          />
          <p className="mt-1 text-[10px] text-muted">{(seo.metaTitle || '').length}/70 characters</p>
        </Field>
        <Field label="Meta Description">
          <TextArea
            value={seo.metaDescription}
            onChange={(v) => patchSeo('metaDescription', v)}
            rows={3}
            maxLength={160}
          />
          <p className="mt-1 text-[10px] text-muted">{(seo.metaDescription || '').length}/160 characters</p>
        </Field>
        <Field label="Meta Keywords">
          <TextInput
            value={seo.metaKeywords}
            onChange={(v) => patchSeo('metaKeywords', v)}
            placeholder="BpxPro, BPX, BPEXCH, brand guide"
          />
        </Field>
      </SectionCard>

      <SectionCard title="Hero">
        <Field label="Badge">
          <TextInput value={hero.badge} onChange={(v) => patchHero('badge', v)} />
        </Field>
        <Field label="Headline">
          <TextInput value={hero.headline} onChange={(v) => patchHero('headline', v)} />
        </Field>
        <Field label="Intro paragraph">
          <TextArea value={hero.intro} onChange={(v) => patchHero('intro', v)} rows={4} />
        </Field>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-text">Alias chips</p>
            <button
              type="button"
              onClick={() => patchHero('aliases', [...hero.aliases, 'New alias'])}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {hero.aliases.map((alias, index) => (
              <div key={index} className="flex gap-2">
                <TextInput
                  value={alias}
                  onChange={(v) => {
                    const next = [...hero.aliases]
                    next[index] = v
                    patchHero('aliases', next)
                  }}
                />
                <button
                  type="button"
                  onClick={() => patchHero('aliases', hero.aliases.filter((_, i) => i !== index))}
                  className="rounded border border-border px-2 text-muted hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Alias Cards">
        <div className="space-y-3">
          {form.aliasCards.map((card, index) => (
            <div key={index} className="rounded border border-border/70 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-muted">Card {index + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      aliasCards: prev.aliasCards.filter((_, i) => i !== index),
                    }))
                  }
                  className="text-muted hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <TextInput
                value={card.alias}
                onChange={(v) => {
                  const next = [...form.aliasCards]
                  next[index] = { ...next[index], alias: v }
                  setForm((prev) => ({ ...prev, aliasCards: next }))
                }}
                placeholder="Alias name"
              />
              <TextArea
                value={card.note}
                onChange={(v) => {
                  const next = [...form.aliasCards]
                  next[index] = { ...next[index], note: v }
                  setForm((prev) => ({ ...prev, aliasCards: next }))
                }}
                placeholder="Description"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                aliasCards: [...prev.aliasCards, { alias: '', note: '' }],
              }))
            }
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent"
          >
            <Plus className="h-3.5 w-3.5" /> Add alias card
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Platform Section">
        <Field label="Badge">
          <TextInput value={platform.badge} onChange={(v) => patchPlatform('badge', v)} />
        </Field>
        <Field label="Title">
          <TextInput value={platform.title} onChange={(v) => patchPlatform('title', v)} />
        </Field>
        <Field label="Body">
          <TextArea value={platform.body} onChange={(v) => patchPlatform('body', v)} rows={4} />
        </Field>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-text">Highlights</p>
            <button
              type="button"
              onClick={() => patchPlatform('highlights', [...platform.highlights, ''])}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {platform.highlights.map((item, index) => (
              <div key={index} className="flex gap-2">
                <TextInput
                  value={item}
                  onChange={(v) => {
                    const next = [...platform.highlights]
                    next[index] = v
                    patchPlatform('highlights', next)
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    patchPlatform(
                      'highlights',
                      platform.highlights.filter((_, i) => i !== index),
                    )
                  }
                  className="rounded border border-border px-2 text-muted hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Useful Links">
        <Field label="Badge">
          <TextInput value={links.badge} onChange={(v) => patchLinks('badge', v)} />
        </Field>
        <Field label="Title">
          <TextInput value={links.title} onChange={(v) => patchLinks('title', v)} />
        </Field>
        <div className="space-y-3">
          {links.items.map((item, index) => (
            <div key={index} className="rounded border border-border/70 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-muted">Link {index + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    patchLinks(
                      'items',
                      links.items.filter((_, i) => i !== index),
                    )
                  }
                  className="text-muted hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <TextInput
                value={item.label}
                onChange={(v) => {
                  const next = [...links.items]
                  next[index] = { ...next[index], label: v }
                  patchLinks('items', next)
                }}
                placeholder="Link label"
              />
              <TextInput
                value={item.path}
                onChange={(v) => {
                  const next = [...links.items]
                  next[index] = { ...next[index], path: v }
                  patchLinks('items', next)
                }}
                placeholder="/blog or /#faq"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => patchLinks('items', [...links.items, { label: '', path: '' }])}
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent"
          >
            <Plus className="h-3.5 w-3.5" /> Add link
          </button>
        </div>
      </SectionCard>

      <div className="flex justify-end pb-6">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded bg-accent px-5 py-2.5 text-xs font-bold text-navy-dark disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Brand Guide'}
        </button>
      </div>
    </div>
  )
}
