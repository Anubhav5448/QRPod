'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';

interface RestaurantSummary {
  id: string;
  name: string;
  slug: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  currency: string;
  memberCount: number;
  createdAt: string;
}

export default function DashboardPage() {
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/superadmin/restaurants?limit=5')
      .then((res) => {
        setRestaurants(res.data?.data?.items ?? []);
      })
      .catch(() => {
        setRestaurants([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    total: restaurants.length,
    active: restaurants.filter((r) => r.status === 'ACTIVE').length,
    pending: restaurants.filter((r) => r.status === 'PENDING').length,
    suspended: restaurants.filter((r) => r.status === 'SUSPENDED').length,
  };

  const cards = [
    {
      label: 'Total Restaurants',
      value: loading ? '—' : counts.total,
      icon: Building2,
      color: 'text-neutral-600',
    },
    {
      label: 'Active',
      value: loading ? '—' : counts.active,
      icon: CheckCircle2,
      color: 'text-green-600',
    },
    {
      label: 'Pending Approval',
      value: loading ? '—' : counts.pending,
      icon: AlertTriangle,
      color: 'text-amber-600',
    },
    {
      label: 'Suspended',
      value: loading ? '—' : counts.suspended,
      icon: PauseCircle,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Overview</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Platform-wide metrics and recent activity
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white rounded-xl border border-neutral-200 p-5"
          >
            <c.icon className={`w-5 h-5 mb-3 ${c.color}`} />
            <div className="text-2xl font-semibold text-neutral-900">
              {c.value}
            </div>
            <div className="text-sm text-neutral-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Recent restaurants */}
      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="font-medium text-neutral-900">
            Recent Restaurants
          </h2>
          <Link
            href="/restaurants"
            className="text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-neutral-500">Loading…</div>
        ) : restaurants.length === 0 ? (
          <div className="p-6 text-sm text-neutral-500">
            No restaurants yet.{' '}
            <Link
              href="/restaurants/new"
              className="text-neutral-900 underline"
            >
              Create one
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {restaurants.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/restaurants/${r.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition"
                >
                  <div>
                    <div className="font-medium text-neutral-900">
                      {r.name}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {r.slug} · {r.memberCount} member
                      {r.memberCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}