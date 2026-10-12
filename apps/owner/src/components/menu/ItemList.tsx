'use client';

import { useState } from 'react';
import { Plus, AlertCircle, UtensilsCrossed } from 'lucide-react';
import { api } from '@/lib/api';
import type { MenuCategory, MenuItem } from '@/app/(protected)/menu/page';
import { ItemCard } from './ItemCard';
import { ItemDialog } from './ItemDialog';

interface Props {
  categories: MenuCategory[];
  items: MenuItem[];
  selectedCategoryId: string | null;
  onItemCreated: () => void | Promise<void>;
  onItemUpdated: () => void | Promise<void>;
  onItemDeleted: () => void | Promise<void>;
  error: string | null;
}

export function ItemList({
  categories,
  items,
  selectedCategoryId,
  onItemCreated,
  onItemUpdated,
  onItemDeleted,
  error,
}: Props) {
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

  const selectedCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null;

  const title = selectedCategory?.name ?? 'All Items';
  const canAddItem = categories.length > 0;

  const handleEdit = (item: MenuItem) => {
    setEditing(item);
    setShowDialog(true);
  };

  const handleAddNew = () => {
    if (!canAddItem) {
      alert('Create a category first before adding items.');
      return;
    }
    setEditing(null);
    setShowDialog(true);
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 mb-6">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <UtensilsCrossed className="w-8 h-8 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-neutral-900 mb-1">
            No categories yet
          </h3>
          <p className="text-sm text-neutral-500">
            Create a category first to start adding menu items.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <h3 className="text-sm font-medium text-neutral-900 mb-1">
            No items yet
          </h3>
          <p className="text-sm text-neutral-500 mb-6">
            Add your first item to {selectedCategory ? selectedCategory.name : 'this category'}.
          </p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition"
          >
            <Plus className="w-4 h-4" />
            Add First Item
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="divide-y divide-neutral-100">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={() => handleEdit(item)}
                onUpdated={onItemUpdated}
                onDeleted={onItemDeleted}
              />
            ))}
          </div>
        </div>
      )}

      {showDialog && (
        <ItemDialog
          item={editing}
          categories={categories}
          defaultCategoryId={selectedCategoryId ?? undefined}
          onClose={() => {
            setShowDialog(false);
            setEditing(null);
            Promise.resolve(onItemUpdated()).catch(() => {});
          }}
          onSaved={async () => {
            setShowDialog(false);
            setEditing(null);
            if (editing) {
              await onItemUpdated();
            } else {
              await onItemCreated();
            }
          }}
        />
      )}
    </div>
  );
}