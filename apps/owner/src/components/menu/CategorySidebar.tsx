'use client';

import { useState } from 'react';
import { Plus, MoreVertical, Pencil, Trash2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { MenuCategory } from '@/app/(protected)/menu/page';

interface Props {
  categories: MenuCategory[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCreated: () => void | Promise<void>;
  onUpdated: () => void | Promise<void>;
  onDeleted: () => void | Promise<void>;
  totalItemCount: number;
}

export function CategorySidebar({
  categories,
  selectedId,
  onSelect,
  onCreated,
  onUpdated,
  onDeleted,
  totalItemCount,
}: Props) {
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<MenuCategory | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const totalCount = categories.reduce((sum, c) => sum + c._count.items, 0);

  const handleEdit = (cat: MenuCategory) => {
    setEditing(cat);
    setShowDialog(true);
    setMenuOpenId(null);
  };

  const handleDelete = async (cat: MenuCategory) => {
    if (cat._count.items > 0) {
      alert(
        `Cannot delete "${cat.name}" — it has ${cat._count.items} item(s). Delete or move them first.`,
      );
      return;
    }
    if (!confirm(`Delete category "${cat.name}"?`)) return;

    try {
      await api.delete(`/owner/menu/categories/${cat.id}`);
      setMenuOpenId(null);
      await onDeleted();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to delete category');
    }
  };

  return (
    <>
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-900">
            Categories
          </h2>
        </div>

        <nav className="flex-1 overflow-auto p-2 space-y-0.5">
          <button
            onClick={() => onSelect(null)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
              selectedId === null
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <span>All Items</span>
            <span
              className={`text-xs ${
                selectedId === null ? 'text-neutral-400' : 'text-neutral-400'
              }`}
            >
              {totalCount}
            </span>
          </button>

          {categories.map((cat) => (
            <div key={cat.id} className="relative group">
              <button
                onClick={() => onSelect(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 pr-9 rounded-lg text-sm transition ${
                  selectedId === cat.id
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <span className="truncate text-left">{cat.name}</span>
                <span
                  className={`text-xs ${
                    selectedId === cat.id
                      ? 'text-neutral-400'
                      : 'text-neutral-400'
                  }`}
                >
                  {cat._count.items}
                </span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === cat.id ? null : cat.id);
                }}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition ${
                  selectedId === cat.id
                    ? 'text-white hover:bg-white/20'
                    : 'text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700'
                }`}
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {menuOpenId === cat.id && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpenId(null)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg border border-neutral-200 shadow-lg z-20 py-1">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-neutral-100">
          <button
            onClick={() => {
              setEditing(null);
              setShowDialog(true);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50 transition"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </aside>

      {showDialog && (
        <CategoryDialog
          category={editing}
          onClose={() => {
            setShowDialog(false);
            setEditing(null);
          }}
          onSaved={async () => {
            setShowDialog(false);
            setEditing(null);
            if (editing) {
              await onUpdated();
            } else {
              await onCreated();
            }
          }}
        />
      )}
    </>
  );
}

// ─── Dialog ─────────────────────────────────────────────────

function CategoryDialog({
  category,
  onClose,
  onSaved,
}: {
  category: MenuCategory | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const isEdit = !!category;
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: any = { name: name.trim() };
      if (description.trim()) payload.description = description.trim();

      if (isEdit) {
        await api.patch(`/owner/menu/categories/${category!.id}`, payload);
      } else {
        await api.post('/owner/menu/categories', payload);
      }
      await onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to save');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            {isEdit ? 'Edit Category' : 'New Category'}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Starters"
              className={inputClass}
              disabled={submitting}
              maxLength={120}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional — shown to customers"
              rows={2}
              className={inputClass}
              disabled={submitting}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-6 border-t border-neutral-200">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-60 transition flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : isEdit ? (
              'Save Changes'
            ) : (
              'Create Category'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition disabled:opacity-60';