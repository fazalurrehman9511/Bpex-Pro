import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { slugifyCategoryId } from '../../data/blogCategories'

const EMPTY_FORM = { id: '', label: '', sortOrder: '' }

export default function BlogCategoriesPanel({
  categories,
  onCreate,
  onUpdate,
  onDelete,
  saving,
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const startCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const startEdit = (category) => {
    setEditingId(category.id)
    setForm({
      id: category.id,
      label: category.label,
      sortOrder: String(category.sortOrder ?? 0),
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const label = form.label.trim()
    if (!label) return

    const payload = {
      label,
      sortOrder: form.sortOrder === '' ? undefined : Number(form.sortOrder),
    }

    if (editingId) {
      if (form.id.trim() && form.id.trim() !== editingId) {
        payload.id = slugifyCategoryId(form.id)
      }
      await onUpdate(editingId, payload)
    } else {
      const id = form.id.trim() ? slugifyCategoryId(form.id) : slugifyCategoryId(label)
      await onCreate({ ...payload, id })
    }
    resetForm()
  }

  return (
    <section className="mb-6 rounded-lg border border-border bg-navy-light p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-text">Blog Categories</h3>
          <p className="text-[10px] text-muted">
            Add and manage categories used on blog posts and the public blog page.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-1.5 rounded bg-accent px-3 py-2 text-xs font-bold text-navy-dark"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Category
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 rounded-lg border border-border bg-navy p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-text">Label *</label>
              <input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Cricket"
                className="w-full rounded border border-border bg-navy-light px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-text">ID (slug)</label>
              <input
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                placeholder={editingId ? editingId : 'auto from label'}
                className="w-full rounded border border-border bg-navy-light px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <p className="mt-1 text-[10px] text-muted">Lowercase letters, numbers, hyphens only</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-text">Sort order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                placeholder="0"
                className="w-full rounded border border-border bg-navy-light px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-accent px-4 py-2 text-xs font-bold text-navy-dark disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingId ? 'Update Category' : 'Add Category'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded border border-border px-4 py-2 text-xs font-semibold text-muted hover:text-text"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {categories.length === 0 ? (
        <p className="text-sm text-muted">No categories yet. Add your first category above.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead className="border-b border-border bg-navy text-muted">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Label</th>
                <th className="px-3 py-2.5 font-semibold">ID</th>
                <th className="px-3 py-2.5 font-semibold">Order</th>
                <th className="px-3 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2.5 font-medium text-text">{category.label}</td>
                  <td className="px-3 py-2.5 font-mono text-muted">{category.id}</td>
                  <td className="px-3 py-2.5 text-muted">{category.sortOrder ?? 0}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(category)}
                        className="rounded p-1.5 text-muted hover:bg-navy hover:text-accent"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(category.id)}
                        disabled={saving}
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
    </section>
  )
}
