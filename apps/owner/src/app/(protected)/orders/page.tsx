'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, AlertCircle, Bell, BellOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { OrderCard, type Order } from '@/components/orders/OrderCard';

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'New', value: 'PENDING' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Preparing', value: 'PREPARING' },
  { label: 'Ready', value: 'READY' },
  { label: 'Served', value: 'SERVED' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundEnabledRef = useRef(soundEnabled);

  // Keep ref in sync so socket handlers always see latest
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Create a tiny "ping" sound as base64
  useEffect(() => {
    // Simple two-tone beep as base64 WAV
    const beepDataUri =
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
    audioRef.current = new Audio(beepDataUri);
    audioRef.current.volume = 0.5;
  }, []);

  // Load restaurant ID first (for socket room)
  useEffect(() => {
    api
      .get('/auth/me')
      .then((res) => {
        const rid = res.data?.data?.memberships?.[0]?.restaurant?.id;
        if (rid) setRestaurantId(rid);
      })
      .catch(() => {});
  }, []);

  // Fetch orders
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await api.get(`/owner/orders${params}`);
      setOrders(res.data?.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Socket connection
  useEffect(() => {
    if (!restaurantId) return;

    const socket = connectSocket();

    socket.on('connect', () => {
      console.log('[socket] connected');
      socket.emit('join', { room: `restaurant:${restaurantId}` });
    });

    socket.on('order.created', (order: Order) => {
      console.log('[socket] order.created', order);
      // Prepend to list
      setOrders((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });

      // Play sound
      if (soundEnabledRef.current && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }

      // Toast notification
      toast.success(`New order: ${order.orderNumber}`, {
        description: `Table ${order.table.tableNumber} · ₹${order.totalAmount}`,
        duration: 5000,
      });
    });

    socket.on('order.status_changed', (payload: any) => {
      console.log('[socket] order.status_changed', payload);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === payload.orderId ? { ...o, status: payload.status } : o,
        ),
      );
    });

    return () => {
      socket.off('order.created');
      socket.off('order.status_changed');
      disconnectSocket();
    };
  }, [restaurantId]);

  // Filter locally for instant response
  const visibleOrders = useMemo(() => {
    if (!filter) return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const handleOrderUpdated = (updated: Order) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updated.id ? updated : o)),
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              Live Orders
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Real-time order feed
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled((s) => !s)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50 transition"
              title={soundEnabled ? 'Sound on' : 'Sound off'}
            >
              {soundEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={loadOrders}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50 transition disabled:opacity-60"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {FILTERS.map((f) => {
            const count =
              f.value === ''
                ? orders.length
                : orders.filter((o) => o.status === f.value).length;
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {f.label}
                <span
                  className={`text-xs ${
                    active ? 'text-neutral-400' : 'text-neutral-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 mb-6">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <h3 className="text-sm font-medium text-neutral-900 mb-1">
              No {filter ? filter.toLowerCase() : ''} orders
            </h3>
            <p className="text-sm text-neutral-500">
              Orders will appear here as customers place them.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdated={handleOrderUpdated}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}