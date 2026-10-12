'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: {
    menuItemId: string;
    name: string;
    price: number;
    imageUrl: string | null;
  }) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  isHydrated: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'customer_cart_v1';

interface StoredCart {
  items: CartItem[];
  savedAt: number;
}

// Cart expires after 4 hours (safety for stale carts)
const MAX_AGE_MS = 4 * 60 * 60 * 1000;

function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: StoredCart = JSON.parse(raw);

    // Expire old carts
    if (!parsed.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    if (!Array.isArray(parsed.items)) return [];

    // Sanitize each item
    return parsed.items
      .filter(
        (i) =>
          i &&
          typeof i.menuItemId === 'string' &&
          typeof i.name === 'string' &&
          typeof i.price === 'number' &&
          typeof i.quantity === 'number' &&
          i.quantity > 0,
      )
      .map((i) => ({
        menuItemId: i.menuItemId,
        name: i.name,
        price: i.price,
        imageUrl: i.imageUrl ?? null,
        quantity: i.quantity,
      }));
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    if (items.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const payload: StoredCart = { items, savedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage full or blocked — ignore
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setItems(loadCartFromStorage());
    setIsHydrated(true);
  }, []);

  // Persist on every change (after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    saveCartToStorage(items);
  }, [items, isHydrated]);

  const addItem = useCallback(
    (item: {
      menuItemId: string;
      name: string;
      price: number;
      imageUrl: string | null;
    }) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.menuItemId === item.menuItemId);
        if (existing) {
          return prev.map((i) =>
            i.menuItemId === item.menuItemId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          );
        }
        return [...prev, { ...item, quantity: 1 }];
      });
    },
    [],
  );

  const updateQuantity = useCallback(
    (menuItemId: string, quantity: number) => {
      if (quantity <= 0) {
        setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.menuItemId === menuItemId ? { ...i, quantity } : i,
        ),
      );
    },
    [],
  );

  const removeItem = useCallback((menuItemId: string) => {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      isHydrated,
    }),
    [
      items,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      isHydrated,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}