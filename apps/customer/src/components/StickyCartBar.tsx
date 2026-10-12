'use client';

import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/cart-store';

interface Props {
  currency: string;
  qrToken: string;
}

export function StickyCartBar({ currency, qrToken }: Props) {
  const { itemCount, subtotal, isHydrated } = useCart();

  if (!isHydrated) return null;

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 pointer-events-none">
      <Link
        href={`/r/${qrToken}/cart`}
        className="pointer-events-auto block bg-neutral-900 text-white rounded-2xl px-5 py-4 shadow-lg hover:bg-neutral-800 active:scale-[0.99] transition"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-neutral-900 text-[10px] font-semibold flex items-center justify-center">
                {itemCount}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-xs text-neutral-400">Your order</div>
              <div className="font-semibold">
                {itemCount} item{itemCount !== 1 ? 's' : ''} · ₹
                {subtotal.toFixed(0)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium shrink-0">
            View Cart
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </Link>
    </div>
  );
}