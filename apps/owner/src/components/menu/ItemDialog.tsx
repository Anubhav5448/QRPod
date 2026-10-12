'use client';

import { useState } from 'react';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';
import type { MenuCategory, MenuItem } from '@/app/(protected)/menu/page';
import { ImageUploader } from './ImageUploader';

interface Props {
  item: MenuItem | null;
  categories: MenuCategory[];
  defaultCategoryId?: string;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

export function ItemDialog({
  item,
  categories,
  defaultCategoryId,
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!item;
  const [categoryId, setCategoryId] = useState(
    item?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? '',
  );
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [price, setPrice] = useState(
    item?.price ? String(parseFloat(item.price)) : '',
  );
  const [prepTime, setPrepTime] = useState(
    item?.prepTimeMinutes ? String(item.prepTimeMinutes) : '',
  );
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [imageUrl, setImageUrl] = useState<string | null>(
    item?.imageUrl ?? null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId) {
      setError('Please select a category');
      return;
    }
    if (!name.trim()) {
      setError('Item name is required');
      return;
    }
    const priceNum = parseFloat(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError('Please enter a valid price');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        categoryId,
        name: name.trim(),
        price: priceNum,
        isAvailable,
      };
      if (description.trim()) payload.description = description.trim();
      if (prepTime) {
        const n = parseInt(prepTime, 10);
        if (Number.isInteger(n) && n > 0) payload.prepTimeMinutes = n;
      }

      if (isEdit) {
        await api.patch(`/owner/menu/items/${item!.id}`, payload);
      } else {
        await api.post('/owner/menu/items', payload);
      }
      await onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to save item');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            {isEdit ? 'Edit Item' : 'New Menu Item'}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
              disabled={submitting}
            >
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Butter Chicken"
              className={inputClass}
              disabled={submitting}
              maxLength={150}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description shown to customers"
              rows={2}
              className={inputClass}
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="280"
                min={0}
                step="0.01"
                className={inputClass}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Prep time (min)
              </label>
              <input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="15"
                min={1}
                className={inputClass}
                disabled={submitting}
              />
            </div>
          </div>

          {/* ─── Item Image ──────────────────────────── */}
          {isEdit ? (
            <ImageUploader
              itemId={item!.id}
              imageUrl={imageUrl}
              onUploaded={(url) => setImageUrl(url)}
              disabled={submitting}
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Item Image
              </label>
              <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center">
                <ImageIcon className="w-5 h-5 text-neutral-400 mx-auto mb-2" />
                <p className="text-xs text-neutral-500">
                  Create the item first, then edit it to add an image.
                </p>
              </div>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              disabled={submitting}
              className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            <div>
              <div className="text-sm font-medium text-neutral-900">
                Available for ordering
              </div>
              <div className="text-xs text-neutral-500">
                Uncheck to hide from customers
              </div>
            </div>
          </label>

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
              'Create Item'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition disabled:opacity-60';