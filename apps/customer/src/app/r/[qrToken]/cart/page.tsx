'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import { useCart } from '@/lib/cart-store';

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      }
    >
      <CartContent />
    </Suspense>
  );
}

function CartContent() {
  const params = useParams<{ qrToken: string }>();
  const router = useRouter();
  const qrToken = params.qrToken;

  const { items, itemCount, subtotal, updateQuantity, removeItem, isHydrated } = useCart();

  // Tax calculation (hardcoded for now — will use restaurant config later)
  const TAX_RATE = 0.05;
  const taxAmount = subtotal * TAX_RATE;
  const total = subtotal + taxAmount;

  // Wait for localStorage hydration before deciding if cart is empty
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <div className="bg-white border-b border-neutral-200 px-5 py-4 sticky top-0 z-30">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-neutral-400" />
            </div>
            <h1 className="text-lg font-semibold text-neutral-900 mb-1">
              Your cart is empty
            </h1>
            <p className="text-sm text-neutral-500 mb-6">
              Add items from the menu to get started.
            </p>
            <Link
              href={`/r/${qrToken}`}
              className="inline-block px-5 py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition"
            >
              Browse Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-5 py-4 sticky top-0 z-30">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </button>
        <h1 className="text-lg font-semibold text-neutral-900 mt-2">
          Your Order
        </h1>
      </div>

      {/* Items */}
      <div className="p-4 space-y-3">
        {items.map((item) => {
          const lineTotal = item.price * item.quantity;

          return (
            <div
              key={item.menuItemId}
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
            >
              <div className="flex gap-3 p-3">
                {/* Image */}
                <div className="w-20 h-20 rounded-lg bg-neutral-100 flex-shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-neutral-300" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-neutral-900 text-sm truncate">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => removeItem(item.menuItemId)}
                        className="text-neutral-400 hover:text-red-600 transition p-1 -mt-1 -mr-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      ₹{item.price.toFixed(0)} each
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity stepper */}
                    <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.menuItemId, item.quantity - 1)
                        }
                        className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-700 hover:bg-white transition active:scale-95"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-neutral-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.menuItemId, item.quantity + 1)
                        }
                        className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-700 hover:bg-white transition active:scale-95"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line total */}
                    <span className="font-semibold text-neutral-900">
                      ₹{lineTotal.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="p-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Subtotal</span>
            <span className="text-neutral-900 font-medium">
              ₹{subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Tax (5%)</span>
            <span className="text-neutral-900 font-medium">
              ₹{taxAmount.toFixed(2)}
            </span>
          </div>
          <div className="border-t border-neutral-100 pt-2 mt-2 flex items-center justify-between">
            <span className="font-semibold text-neutral-900">Total</span>
            <span className="font-semibold text-neutral-900 text-lg">
              ₹{total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-neutral-50 via-neutral-50 to-transparent pointer-events-none">
        <Link
          href={`/r/${qrToken}/checkout`}
          className="pointer-events-auto block bg-neutral-900 text-white rounded-2xl px-5 py-4 text-center font-medium shadow-lg hover:bg-neutral-800 active:scale-[0.99] transition"
        >
          Proceed to Checkout · ₹{total.toFixed(0)}
        </Link>
      </div>
    </div>
  );
}