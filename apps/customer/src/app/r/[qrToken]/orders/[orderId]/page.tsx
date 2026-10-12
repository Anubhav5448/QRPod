'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  ChefHat,
  BellRing,
  Utensils,
} from 'lucide-react';
import { api } from '@/lib/api';

interface OrderDetail {
  id: string;
  orderNumber: string;
  status:
    | 'PENDING'
    | 'ACCEPTED'
    | 'PREPARING'
    | 'READY'
    | 'SERVED'
    | 'COMPLETED'
    | 'CANCELLED';
  paymentStatus: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    itemNote: string | null;
  }>;
  subtotal: number;
  taxAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  customerName: string | null;
  table: { tableNumber: string; displayName: string | null };
  restaurant: { name: string; currency: string };
  placedAt: string;
}

const STATUS_STEPS: Array<{
  key: OrderDetail['status'];
  label: string;
  icon: any;
}> = [
  { key: 'PENDING', label: 'Order Received', icon: Clock },
  { key: 'ACCEPTED', label: 'Accepted', icon: CheckCircle2 },
  { key: 'PREPARING', label: 'Preparing', icon: ChefHat },
  { key: 'READY', label: 'Ready to Serve', icon: BellRing },
  { key: 'SERVED', label: 'Served', icon: Utensils },
];

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}

function OrderConfirmationContent() {
  const params = useParams<{ qrToken: string; orderId: string }>();
  const { qrToken, orderId } = params;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load once
  useEffect(() => {
    api
      .get(`/public/orders/${orderId}`)
      .then((res) => setOrder(res.data?.data ?? null))
      .catch(() => setError('Failed to load order'))
      .finally(() => setLoading(false));
  }, [orderId]);

  // Poll every 5s for status updates (until SERVED)
  useEffect(() => {
    if (!order) return;
    if (order.status === 'SERVED' || order.status === 'COMPLETED') return;

    const interval = setInterval(() => {
      api
        .get(`/public/orders/${orderId}`)
        .then((res) => {
          const updated = res.data?.data;
          if (updated) setOrder(updated);
        })
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [order?.status, orderId, order]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-neutral-900 mb-1">
            Couldn&apos;t load order
          </h1>
          <p className="text-sm text-neutral-500">{error}</p>
        </div>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(
    (s) => s.key === order.status,
  );
  const activeSteps =
    currentStepIndex >= 0 ? currentStepIndex : order.status === 'COMPLETED' ? STATUS_STEPS.length - 1 : 0;

  return (
    <div className="min-h-screen bg-neutral-50 pb-10">
      {/* Success banner */}
      <div className="bg-neutral-900 text-white px-6 pt-8 pb-10 text-center">
        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-xl font-semibold">Order confirmed</h1>
        <p className="text-sm text-neutral-300 mt-1">
          {order.orderNumber}
        </p>
        <p className="text-xs text-neutral-400 mt-0.5">
          Table {order.table.tableNumber}
          {order.table.displayName && ` · ${order.table.displayName}`}
        </p>
      </div>

      {/* Status stepper */}
      <div className="px-6 -mt-6 mb-4">
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
          <div className="space-y-4">
            {STATUS_STEPS.map((step, idx) => {
              const isActive = idx <= activeSteps;
              const isCurrent = idx === activeSteps;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition ${
                      isCurrent
                        ? 'bg-neutral-900 text-white'
                        : isActive
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm ${
                        isActive
                          ? 'text-neutral-900 font-medium'
                          : 'text-neutral-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {isCurrent && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {order.status !== 'SERVED' && order.status !== 'COMPLETED' && (
            <p className="text-xs text-neutral-400 mt-4 pt-4 border-t border-neutral-100">
              Status updates automatically every few seconds.
            </p>
          )}
        </div>
      </div>

      {/* Order details */}
      <div className="px-4 space-y-3">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <h2 className="text-sm font-medium text-neutral-900 mb-3">
            Your Items
          </h2>
          <ul className="space-y-2 text-sm">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-neutral-700">
                    {item.quantity} × {item.name}
                  </div>
                  {item.itemNote && (
                    <div className="text-xs text-neutral-400 mt-0.5">
                      Note: {item.itemNote}
                    </div>
                  )}
                </div>
                <span className="text-neutral-900 font-medium shrink-0">
                  ₹{item.lineTotal.toFixed(0)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-4 border-t border-neutral-100 space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Subtotal</span>
              <span className="text-neutral-900">
                ₹{order.subtotal.toFixed(2)}
              </span>
            </div>
            {order.taxAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Tax</span>
                <span className="text-neutral-900">
                  ₹{order.taxAmount.toFixed(2)}
                </span>
              </div>
            )}
            {order.serviceChargeAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Service Charge</span>
                <span className="text-neutral-900">
                  ₹{order.serviceChargeAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-neutral-100">
              <span className="font-semibold text-neutral-900">Total</span>
              <span className="font-semibold text-neutral-900 text-base">
                ₹{order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 text-center">
          <Link
            href={`/r/${qrToken}`}
            className="text-sm text-neutral-600 hover:text-neutral-900 underline"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    </div>
  );
}