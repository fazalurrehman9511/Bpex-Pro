import { Plus, Trash2 } from 'lucide-react'
import {
  DEFAULT_RESPONSIBLE_GAMING_CONTENT,
  normalizeResponsibleGamingContent,
} from '../../data/responsibleGamingContent'

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

function paragraphsToText(paragraphs) {
  return (paragraphs || []).join('\n\n')
}

function textToParagraphs(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function bulletsToText(bullets) {
  return (bullets || []).join('\n')
}

function textToBullets(text) {
  return String(text || '')
    .split('\n')
    .map((part) => part.trim())
    .filter(Boolean)
}

export default function ResponsibleGamingContentPanel({
  form,
  setForm,
  onSave,
  saving,
  updatedAt,
}) {
  if (!form) {
    return (
      <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted">
        Loading responsible gaming content…
      </div>
    )
  }

  const seo = form.seo || DEFAULT_RESPONSIBLE_GAMING_CONTENT.seo
  const page = form.page || DEFAULT_RESPONSIBLE_GAMING_CONTENT.page

  const patchSeo = (key, value) => {
    setForm((prev) => ({
      ...prev,
      seo: { ...(prev.seo || DEFAULT_RESPONSIBLE_GAMING_CONTENT.seo), [key]: value },
    }))
  }

  const patchPage = (key, value) => {
    setForm((prev) => ({
      ...prev,
      page: { ...(prev.page || DEFAULT_RESPONSIBLE_GAMING_CONTENT.page), [key]: value },
    }))
  }

  const updateSection = (index, patch) => {
    setForm((prev) => {
      const next = [...prev.sections]
      next[index] = { ...next[index], ...patch }
      return { ...prev, sections: next }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-navy-light px-4 py-3">
        <div>
          <p className="text-sm font-bold text-text">Responsible Gaming (/responsible-gaming)</p>
          <p className="text-[10px] text-muted">
            {updatedAt
              ? `Last updated ${new Date(updatedAt).toLocaleString()}`
              : 'Edit the responsible gaming policy page'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setForm(normalizeResponsibleGamingContent(DEFAULT_RESPONSIBLE_GAMING_CONTENT))}
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
            {saving ? 'Saving…' : 'Save Page'}
          </button>
        </div>
      </div>

      <SectionCard title="SEO — Meta Title, Description & Keywords">
        <Field label="Meta Title">
          <TextInput value={seo.metaTitle} onChange={(v) => patchSeo('metaTitle', v)} maxLength={70} />
        </Field>
        <Field label="Meta Description">
          <TextArea value={seo.metaDescription} onChange={(v) => patchSeo('metaDescription', v)} rows={3} maxLength={160} />
        </Field>
        <Field label="Meta Keywords">
          <TextInput value={seo.metaKeywords} onChange={(v) => patchSeo('metaKeywords', v)} />
        </Field>
      </SectionCard>

      <SectionCard title="Page Header">
        <Field label="Badge">
          <TextInput value={page.badge} onChange={(v) => patchPage('badge', v)} />
        </Field>
        <Field label="Title">
          <TextInput value={page.title} onChange={(v) => patchPage('title', v)} />
        </Field>
        <Field label="Intro">
          <TextArea value={page.intro} onChange={(v) => patchPage('intro', v)} rows={4} />
        </Field>
        <Field label="Last updated label">
          <TextInput value={page.lastUpdated} onChange={(v) => patchPage('lastUpdated', v)} />
        </Field>
      </SectionCard>

      <SectionCard title="Content Sections">
        <div className="space-y-4">
          {form.sections.map((section, index) => (
            <div key={index} className="rounded border border-border/70 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-muted">Section {index + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      sections: prev.sections.filter((_, i) => i !== index),
                    }))
                  }
                  className="text-muted hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <TextInput
                value={section.title}
                onChange={(v) => updateSection(index, { title: v })}
                placeholder="Section title"
              />
              <Field label="Paragraphs (blank line between paragraphs)">
                <TextArea
                  value={paragraphsToText(section.paragraphs)}
                  onChange={(v) => updateSection(index, { paragraphs: textToParagraphs(v) })}
                  rows={5}
                />
              </Field>
              <Field label="Bullet points (one per line, optional)">
                <TextArea
                  value={bulletsToText(section.bullets)}
                  onChange={(v) => updateSection(index, { bullets: textToBullets(v) })}
                  rows={4}
                />
              </Field>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                sections: [...prev.sections, { title: '', paragraphs: [], bullets: [] }],
              }))
            }
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent"
          >
            <Plus className="h-3.5 w-3.5" /> Add section
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
          {saving ? 'Saving…' : 'Save Page'}
        </button>
      </div>
    </div>
  )
}
