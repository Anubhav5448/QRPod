'use client';

import { useState } from 'react';
import { Loader2, Clock, User, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  itemNote: string | null;
}

export interface Order {
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
  subtotal: number;
  taxAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  customerName: string | null;
  customerPhone: string | null;
  customerNote: string | null;
  table: { tableNumber: string; displayName: string | null };
  items: OrderItem[];
  placedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
}

interface Props {
  order: Order;
  onUpdated: (order: Order) => void;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  ACCEPTED: 'bg-blue-50 text-blue-700 border-blue-200',
  PREPARING: 'bg-purple-50 text-purple-700 border-purple-200',
  READY: 'bg-green-50 text-green-700 border-green-200',
  SERVED: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  COMPLETED: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

const NEXT_ACTION: Record<
  string,
  { status: string; label: string } | null
> = {
  PENDING: { status: 'ACCEPTED', label: 'Accept Order' },
  ACCEPTED: { status: 'PREPARING', label: 'Start Preparing' },
  PREPARING: { status: 'READY', label: 'Mark Ready' },
  READY: { status: 'SERVED', label: 'Mark Served' },
  SERVED: null,
  COMPLETED: null,
  CANCELLED: null,
};

export function OrderCard({ order, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);

  const nextAction = NEXT_ACTION[order.status];

  const handleTransition = async (status: string) => {
    setLoading(true);
    try {
      const res = await api.patch(
        `/owner/orders/${order.id}/status`,
        { status },
      );
      onUpdated(res.data?.data);
      toast.success(`Order ${order.orderNumber} → ${status}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(
        Array.isArray(msg) ? msg.join(', ') : msg ?? 'Failed to update',
      );
    } finally {
      setLoading(false);
    }
  };

  const timeSince = getTimeSince(order.placedAt);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-neutral-100">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-neutral-900 text-sm">
              #{order.orderNumber}
            </h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${
                STATUS_STYLES[order.status]
              }`}
            >
              {order.status}
            </span>
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">
            Table {order.table.tableNumber}
            {order.table.displayName && ` · ${order.table.displayName}`}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-semibold text-neutral-900">
            ₹{Number(order.totalAmount).toFixed(0)}
          </div>
          <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeSince}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="px-5 py-3">
        <ul className="space-y-1.5">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <div className="flex-1 min-w-0">
                <span className="text-neutral-700">
                  {item.quantity} × {item.name}
                </span>
                {item.itemNote && (
                  <span className="text-xs text-neutral-400 ml-2">
                    · {item.itemNote}
                  </span>
                )}
              </div>
              <span className="text-neutral-500 shrink-0">
                ₹{Number(item.lineTotal).toFixed(0)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Customer info + notes */}
      {(order.customerName || order.customerPhone || order.customerNote) && (
        <div className="px-5 pb-3 space-y-1">
          {order.customerName && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-600">
              <User className="w-3 h-3" />
              {order.customerName}
            </div>
          )}
          {order.customerPhone && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-600">
              <Phone className="w-3 h-3" />
              {order.customerPhone}
            </div>
          )}
          {order.customerNote && (
            <div className="text-xs text-neutral-500 italic mt-1 px-2 py-1.5 bg-neutral-50 rounded">
              &ldquo;{order.customerNote}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {nextAction && (
        <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100 flex justify-end">
          <button
            onClick={() => handleTransition(nextAction.status)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-60 transition"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {nextAction.label}
          </button>
        </div>
      )}
    </div>
  );
}

function getTimeSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
}