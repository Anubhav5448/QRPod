'use client';

import { useState } from 'react';
import {
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Clock,
  ImageOff,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { MenuItem } from '@/app/(protected)/menu/page';

interface Props {
  item: MenuItem;
  onEdit: () => void;
  onUpdated: () => void | Promise<void>;
  onDeleted: () => void | Promise<void>;
}

export function ItemCard({ item, onEdit, onUpdated, onDeleted }: Props) {
  const [toggling, setToggling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await api.patch(`/owner/menu/items/${item.id}/toggle-availability`);
      await onUpdated();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to toggle availability');
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/owner/menu/items/${item.id}`);
      await onDeleted();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to delete item');
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50 transition group">
      {/* Image thumbnail */}
      <div className="w-14 h-14 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageOff className="w-5 h-5 text-neutral-300" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3
            className={`font-medium truncate ${
              item.isAvailable ? 'text-neutral-900' : 'text-neutral-400'
            }`}
          >
            {item.name}
          </h3>
          {!item.isAvailable && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
              Unavailable
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-neutral-500 truncate mt-0.5">
            {item.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-neutral-500 px-2 py-0.5 rounded bg-neutral-100">
            {item.category.name}
          </span>
          {item.prepTimeMinutes && (
            <span className="text-xs text-neutral-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {item.prepTimeMinutes} min
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="text-right shrink-0 w-20">
        <div className="font-semibold text-neutral-900">
          ₹{parseFloat(item.price).toFixed(0)}
        </div>
      </div>

      {/* Actions */}
      {confirming ? (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setConfirming(false)}
            className="px-2.5 py-1.5 rounded-md text-xs font-medium text-neutral-600 hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 flex items-center gap-1"
          >
            {deleting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
            Delete
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleToggle}
            disabled={toggling}
            title={item.isAvailable ? 'Mark unavailable' : 'Mark available'}
            className={`p-2 rounded-lg transition ${
              item.isAvailable
                ? 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                : 'text-green-600 hover:bg-green-50'
            }`}
          >
            {toggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : item.isAvailable ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onEdit}
            title="Edit"
            className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirming(true)}
            title="Delete"
            className="p-2 rounded-lg text-neutral-500 hover:bg-red-50 hover:text-red-600 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}