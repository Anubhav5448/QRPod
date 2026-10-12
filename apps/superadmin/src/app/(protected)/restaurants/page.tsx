'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  currency: string;
  memberCount: number;
  createdAt: string;
}

const filters = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Deactivated', value: 'DEACTIVATED' },
];

export default function RestaurantsListPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = filter ? `?status=${filter}` : '';
    api
      .get(`/superadmin/restaurants${params}`)
      .then((res) => setRestaurants(res.data?.data?.items ?? []))
      .catch(() => setRestaurants([]))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Restaurants
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage all restaurants on the platform
          </p>
        </div>
        <Link
          href="/restaurants/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition"
        >
          <Plus className="w-4 h-4" />
          New Restaurant
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === f.value
                ? 'bg-neutral-900 text-white'
                : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-neutral-500">Loading…</div>
        ) : restaurants.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-neutral-500">
              No restaurants {filter && `with status "${filter}"`} yet.
            </p>
            {!filter && (
              <Link
                href="/restaurants/new"
                className="inline-block mt-4 text-sm text-neutral-900 underline"
              >
                Create your first restaurant
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-6 py-3">
                  Restaurant
                </th>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-6 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-6 py-3">
                  Members
                </th>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-6 py-3">
                  Created
                </th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {restaurants.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-neutral-50 transition cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/restaurants/${r.id}`)
                  }
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-neutral-900">
                      {r.name}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {r.slug}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {r.memberCount}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}