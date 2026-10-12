'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, AlertCircle, ImageOff } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useCart } from '@/lib/cart-store';

interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number | string;
  isAvailable: boolean;
  categoryId: string;
}

interface Props {
  restaurantId: string;
}

export function MenuView({ restaurantId }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    api
      .get(`/public/restaurants/${restaurantId}/menu`)
      .then((res) => {
        const menuData = res.data?.data ?? {};
        setCategories(menuData.categories ?? []);
        setItems(menuData.items ?? []);
        setActiveCategoryId(menuData.categories?.[0]?.id ?? null);
      })
      .catch(() => {
        setError('Failed to load menu');
      })
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const itemsByCategory = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    for (const item of items) {
      if (!map[item.categoryId]) map[item.categoryId] = [];
      map[item.categoryId].push(item);
    }
    return map;
  }, [items]);

  const handleAddToCart = (item: MenuItem) => {
    if (!item.isAvailable) return;

    addItem({
      menuItemId: item.id,
      name: item.name,
      price: Number(item.price),
      imageUrl: item.imageUrl,
    });

    toast.success(`${item.name} added`, { duration: 1500 });
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-neutral-500">{error}</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-neutral-500">
          This restaurant hasn&apos;t added any menu items yet.
        </p>
      </div>
    );
  }

  const activeItems = activeCategoryId
    ? itemsByCategory[activeCategoryId] ?? []
    : items;

  return (
    <>
      {/* Horizontal category scroller */}
      <div className="sticky top-0 z-30 bg-neutral-50 border-b border-neutral-200">
        <div className="flex overflow-x-auto no-scrollbar px-4 py-3 gap-2">
          {categories.map((cat) => {
            const active = cat.id === activeCategoryId;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  active
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-700 border border-neutral-200'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Items for active category */}
      <div className="p-4 space-y-3">
        {activeItems.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-neutral-500">
              No items in this category yet.
            </p>
          </div>
        ) : (
          activeItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onAdd={() => handleAddToCart(item)}
            />
          ))
        )}
      </div>
    </>
  );
}

function MenuItemCard({
  item,
  onAdd,
}: {
  item: MenuItem;
  onAdd: () => void;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-neutral-200 overflow-hidden flex ${
        item.isAvailable ? '' : 'opacity-50'
      }`}
    >
      {/* Image */}
      <div className="w-24 h-24 bg-neutral-100 flex items-center justify-center shrink-0">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <ImageOff className="w-6 h-6 text-neutral-300" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div className="min-w-0">
          <h3 className="font-medium text-neutral-900 text-sm truncate">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="font-semibold text-neutral-900">
            ₹{Number(item.price).toFixed(0)}
          </span>
          {item.isAvailable ? (
            <button
              onClick={onAdd}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          ) : (
            <span className="text-xs text-neutral-500">Unavailable</span>
          )}
        </div>
      </div>
    </div>
  );
}