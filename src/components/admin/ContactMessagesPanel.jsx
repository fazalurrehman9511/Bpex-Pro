import { useMemo, useState } from 'react'
import { Mail, Phone, Search, Trash2, X } from 'lucide-react'

function formatWhen(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function phoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '')
}

export default function ContactMessagesPanel({ messages, onDelete, deletingId }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return messages
    return messages.filter((msg) =>
      [msg.name, msg.phone, msg.email, msg.subject, msg.message, msg.id]
        .filter(Boolean)
        .some((part) => String(part).toLowerCase().includes(q))
    )
  }, [messages, search])

  const handleDelete = async (msg) => {
    if (!window.confirm(`Delete message from "${msg.name}"?`)) return
    await onDelete(msg.id)
    if (selected?.id === msg.id) setSelected(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          Homepage contact form submissions. Total:{' '}
          <span className="font-bold text-text">{messages.length}</span>
        </p>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, subject…"
            className="w-full rounded border border-border bg-navy-light py-2 pl-9 pr-3 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
      </div>

      {!filtered.length ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <Mail className="mx-auto h-10 w-10 text-muted/40" />
          <p className="mt-3 text-sm text-muted">
            {messages.length ? 'No messages match your search.' : 'No contact messages yet.'}
          </p>
          {!messages.length && (
            <p className="mt-1 text-xs text-muted/70">
              Submissions from the homepage Contact Us form will appear here.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="border-b border-border bg-navy-light text-muted">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Date</th>
                <th className="px-3 py-2.5 font-semibold">Name</th>
                <th className="px-3 py-2.5 font-semibold">Phone</th>
                <th className="px-3 py-2.5 font-semibold">Subject</th>
                <th className="px-3 py-2.5 font-semibold">Message</th>
                <th className="px-3 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((msg) => (
                <tr key={msg.id} className="border-b border-border/60 last:border-0">
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted">{formatWhen(msg.createdAt)}</td>
                  <td className="px-3 py-2.5 font-medium text-text">{msg.name}</td>
                  <td className="px-3 py-2.5">
                    <a
                      href={`https://wa.me/${phoneDigits(msg.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-accent hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      {msg.phone}
                    </a>
                  </td>
                  <td className="max-w-[140px] truncate px-3 py-2.5 text-text">{msg.subject || '—'}</td>
                  <td className="max-w-[220px] truncate px-3 py-2.5 text-muted">{msg.message}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        type="button"
                        onClick={() => setSelected(msg)}
                        className="rounded border border-border px-2 py-1 text-[10px] font-semibold text-muted hover:text-accent"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(msg)}
                        disabled={deletingId === msg.id}
                        className="rounded p-1.5 text-muted hover:bg-navy hover:text-red-400 disabled:opacity-60"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-navy-light shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-bold text-text">{selected.name}</p>
                <p className="text-[10px] text-muted">{formatWhen(selected.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded p-1 text-muted hover:text-text"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 px-4 py-4 text-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Phone</p>
                <a
                  href={`https://wa.me/${phoneDigits(selected.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-accent hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {selected.phone}
                </a>
              </div>
              {selected.email && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Email</p>
                  <a href={`mailto:${selected.email}`} className="mt-0.5 text-text hover:text-accent">
                    {selected.email}
                  </a>
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Subject</p>
                <p className="mt-0.5 text-text">{selected.subject || 'General inquiry'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Message</p>
                <p className="mt-1 whitespace-pre-wrap leading-6 text-text">{selected.message}</p>
              </div>
              <p className="text-[10px] text-muted">ID: {selected.id}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
