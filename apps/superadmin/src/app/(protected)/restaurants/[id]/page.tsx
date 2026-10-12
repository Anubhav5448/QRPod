'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Users,
  Calendar,
  Pause,
  Play,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

type RestaurantStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  currency: string;
  status: RestaurantStatus;
  suspendedAt: string | null;
  suspensionReason: string | null;
  createdAt: string;
  members: Array<{
    id: string;
    role: string;
    isActive: boolean;
    user: { id: string; name: string; email: string };
  }>;
}

export default function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api
      .get(`/superadmin/restaurants/${id}`)
      .then((res) => setRestaurant(res.data?.data ?? null))
      .catch(() => setError('Failed to load restaurant'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const updateStatus = async (status: RestaurantStatus) => {
    setActionLoading(true);
    setError(null);
    try {
      const reason =
        status === 'SUSPENDED'
          ? window.prompt('Reason for suspension (optional):') ?? undefined
          : undefined;
      await api.patch(`/superadmin/restaurants/${id}/status`, {
        status,
        reason,
      });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl">
        <div className="text-sm text-neutral-500">Loading…</div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="p-8 max-w-5xl">
        <div className="text-sm text-red-600">
          {error ?? 'Restaurant not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <Link
        href="/restaurants"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Restaurants
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-neutral-900">
              {restaurant.name}
            </h1>
            <StatusBadge status={restaurant.status} />
          </div>
          <p className="text-sm text-neutral-500">{restaurant.slug}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {restaurant.status !== 'ACTIVE' && (
            <button
              onClick={() => updateStatus('ACTIVE')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Activate
            </button>
          )}
          {restaurant.status === 'ACTIVE' && (
            <button
              onClick={() => updateStatus('SUSPENDED')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
              Suspend
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 mb-6">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {restaurant.status === 'SUSPENDED' && restaurant.suspensionReason && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-100 mb-6">
          <p className="text-sm text-red-700">
            <strong>Suspended:</strong> {restaurant.suspensionReason}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-sm font-medium text-neutral-900 mb-4 uppercase tracking-wider">
            Details
          </h2>
          <dl className="space-y-4">
            {restaurant.phone && (
              <InfoRow icon={Phone} label="Phone" value={restaurant.phone} />
            )}
            {restaurant.address && (
              <InfoRow
                icon={MapPin}
                label="Address"
                value={restaurant.address}
              />
            )}
            <InfoRow
              icon={Calendar}
              label="Created"
              value={new Date(restaurant.createdAt).toLocaleString()}
            />
          </dl>
        </div>

        {/* Members card */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-sm font-medium text-neutral-900 mb-4 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" />
            Members ({restaurant.members.length})
          </h2>
          <ul className="space-y-3">
            {restaurant.members.map((m) => (
              <li key={m.id}>
                <div className="font-medium text-sm text-neutral-900">
                  {m.user.name}
                </div>
                <div className="text-xs text-neutral-500">
                  {m.user.email}
                </div>
                <div className="text-xs text-neutral-600 mt-1">
                  Role: <span className="font-medium">{m.role}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
      <div>
        <dt className="text-xs text-neutral-500">{label}</dt>
        <dd className="text-sm text-neutral-900">{value}</dd>
      </div>
    </div>
  );
}