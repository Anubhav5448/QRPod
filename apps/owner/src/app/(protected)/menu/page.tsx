'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { CategorySidebar } from '@/components/menu/CategorySidebar';
import { ItemList } from '@/components/menu/ItemList';

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  _count: { items: number };
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: string;
  prepTimeMinutes: number | null;
  isAvailable: boolean;
  sortOrder: number;
  category: { id: string; name: string };
}

export default function MenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    const res = await api.get('/owner/menu/categories');
    setCategories(res.data?.data ?? []);
  }, []);

  const loadItems = useCallback(async (categoryId: string | null) => {
    const params = categoryId ? `?categoryId=${categoryId}` : '';
    const res = await api.get(`/owner/menu/items${params}`);
    setItems(res.data?.data ?? []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadCategories(), loadItems(selectedCategoryId)]);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, [loadCategories, loadItems, selectedCategoryId]);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  const handleCategoryCreated = async () => {
    await loadCategories();
  };

  const handleCategoryUpdated = async () => {
    await Promise.all([loadCategories(), loadItems(selectedCategoryId)]);
  };

  const handleCategoryDeleted = async () => {
    setSelectedCategoryId(null);
    await loadAll();
  };

  const handleItemCreated = async () => {
    await Promise.all([loadItems(selectedCategoryId), loadCategories()]);
  };

  const handleItemUpdated = async () => {
    await loadItems(selectedCategoryId);
  };

  const handleItemDeleted = async () => {
    await Promise.all([loadItems(selectedCategoryId), loadCategories()]);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden">
      <CategorySidebar
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={handleCategoryChange}
        onCreated={handleCategoryCreated}
        onUpdated={handleCategoryUpdated}
        onDeleted={handleCategoryDeleted}
        totalItemCount={items.length}
      />

      <div className="flex-1 overflow-auto">
        <ItemList
          categories={categories}
          items={items}
          selectedCategoryId={selectedCategoryId}
          onItemCreated={handleItemCreated}
          onItemUpdated={handleItemUpdated}
          onItemDeleted={handleItemDeleted}
          error={error}
        />
      </div>
    </div>
  );
}