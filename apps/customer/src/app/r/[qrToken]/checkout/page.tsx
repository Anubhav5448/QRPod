'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle, ShoppingBag } from 'lucide-react';
import { api } from '@/lib/api';
import { useCart } from '@/lib/cart-store';

interface QrResolution {
  restaurant: { id: string; name: string; currency: string };
  table: { id: string; tableNumber: string; displayName: string | null };
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const params = useParams<{ qrToken: string }>();
  const router = useRouter();
  const qrToken = params.qrToken;

  const { items, itemCount, subtotal, clearCart, isHydrated } = useCart();

  const [qr, setQr] = useState<QrResolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  const TAX_RATE = 0.05;
  const taxAmount = subtotal * TAX_RATE;
  const total = subtotal + taxAmount;

  useEffect(() => {
    api
      .get(`/public/qr/${qrToken}`)
      .then((res) => setQr(res.data?.data ?? null))
      .catch(() => setError('Failed to load restaurant info'))
      .finally(() => setLoading(false));
  }, [qrToken]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        qrToken,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
        })),
      };

      if (customerName.trim()) payload.customerName = customerName.trim();
      if (customerPhone.trim()) payload.customerPhone = customerPhone.trim();
      if (customerNote.trim()) payload.customerNote = customerNote.trim();

      const res = await api.post('/public/orders', payload);
      const orderId = res.data?.data?.id;

      if (!orderId) {
        throw new Error('Order created but no ID returned');
      }

      clearCart();
      router.push(`/r/${qrToken}/orders/${orderId}`);
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      if (status === 400) {
        setError(message ?? 'Invalid order. Please check your cart.');
      } else if (status === 429) {
        setError('Too many attempts. Please wait a moment.');
      } else {
        setError(message ?? 'Failed to place order. Please try again.');
      }
      setSubmitting(false);
    }
  };

  if (loading || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <ShoppingBag className="w-8 h-8 text-neutral-400 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-neutral-900 mb-1">
            Your cart is empty
          </h1>
          <p className="text-sm text-neutral-500 mb-6">
            Add items before checking out.
          </p>
          <Link
            href={`/r/${qrToken}`}
            className="inline-block px-5 py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-5 py-4 sticky top-0 z-30">
        <Link
          href={`/r/${qrToken}/cart`}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </Link>
        <h1 className="text-lg font-semibold text-neutral-900 mt-2">
          Checkout
        </h1>
        {qr && (
          <p className="text-xs text-neutral-500 mt-0.5">
            {qr.restaurant.name} · Table {qr.table.tableNumber}
          </p>
        )}
      </div>

      <form onSubmit={handlePlaceOrder} className="p-4 space-y-4">
        {/* Order Summary */}
        <section className="bg-white rounded-xl border border-neutral-200 p-4">
          <h2 className="text-sm font-medium text-neutral-900 mb-3">
            Order Summary
          </h2>
          <ul className="space-y-2 text-sm">
            {items.map((item) => (
              <li
                key={item.menuItemId}
                className="flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-neutral-700">
                    {item.quantity} × {item.name}
                  </span>
                </div>
                <span className="text-neutral-900 font-medium shrink-0">
                  ₹{(item.price * item.quantity).toFixed(0)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-4 border-t border-neutral-100 space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Subtotal</span>
              <span className="text-neutral-900">
                ₹{subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Tax (5%)</span>
              <span className="text-neutral-900">
                ₹{taxAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-neutral-100">
              <span className="font-semibold text-neutral-900">Total</span>
              <span className="font-semibold text-neutral-900 text-base">
                ₹{total.toFixed(2)}
              </span>
            </div>
          </div>
        </section>

        {/* Customer Details */}
        <section className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
          <h2 className="text-sm font-medium text-neutral-900">
            Your Details
          </h2>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Optional"
              maxLength={120}
              disabled={submitting}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1.5">
              WhatsApp Number
              <span className="text-neutral-400 font-normal ml-1">
                (for bill)
              </span>
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+91 90000 00000"
              maxLength={20}
              disabled={submitting}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1.5">
              Special Instructions
            </label>
            <textarea
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="e.g. Less spicy, no onions"
              maxLength={500}
              rows={2}
              disabled={submitting}
              className={inputClass}
            />
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-14 rounded-2xl bg-neutral-900 text-white font-medium text-base hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Placing Order…
            </>
          ) : (
            <>Place Order · ₹{total.toFixed(0)}</>
          )}
        </button>

        <p className="text-xs text-neutral-400 text-center px-4">
          By placing this order you agree to pay at the counter or via the
          restaurant's preferred method.
        </p>
      </form>
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition disabled:opacity-60 text-sm';