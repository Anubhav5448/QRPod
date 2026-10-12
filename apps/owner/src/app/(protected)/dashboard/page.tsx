'use client';

import { useEffect, useState } from 'react';
import {
  UtensilsCrossed,
  Grid3x3,
  Receipt,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface MeResponse {
  user: { id: string; name: string; email: string };
  memberships: Array<{
    memberId: string;
    role: string;
    restaurant: { id: string; name: string; slug: string; status: string };
  }>;
}

export default function DashboardPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/auth/me')
      .then((res) => setMe(res.data?.data ?? null))
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, []);

  const restaurant = me?.memberships?.[0]?.restaurant;
  const role = me?.memberships?.[0]?.role;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-sm text-neutral-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">
            {restaurant?.name ?? 'Dashboard'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {restaurant?.slug} · Signed in as {role}
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <QuickCard
            href="/menu"
            icon={UtensilsCrossed}
            title="Manage Menu"
            subtitle="Categories & items"
          />
          <QuickCard
            href="/tables"
            icon={Grid3x3}
            title="Tables & QR"
            subtitle="Print QR codes"
          />
          <QuickCard
            href="/orders"
            icon={Receipt}
            title="Live Orders"
            subtitle="View incoming"
          />
          <QuickCard
            href="/settings"
            icon={TrendingUp}
            title="Settings"
            subtitle="Tax & service charge"
          />
        </div>

        {/* Info panel */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="font-medium text-neutral-900 mb-4">
            Getting Started
          </h2>
          <ul className="space-y-2 text-sm text-neutral-600">
            <li className="flex items-start gap-2">
              <span className="text-neutral-400 mt-0.5">1.</span>
              Add your menu categories and items
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neutral-400 mt-0.5">2.</span>
              Create tables and generate QR codes
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neutral-400 mt-0.5">3.</span>
              Print QR codes and place on tables
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neutral-400 mt-0.5">4.</span>
              Customers scan, order, and pay — you get live updates
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function QuickCard({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  icon: any;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-xl border border-neutral-200 p-5 hover:border-neutral-300 hover:shadow-sm transition"
    >
      <Icon className="w-5 h-5 text-neutral-400 mb-3" />
      <div className="font-medium text-neutral-900 text-sm">{title}</div>
      <div className="text-xs text-neutral-500 mt-1">{subtitle}</div>
      <ArrowRight className="w-4 h-4 text-neutral-300 mt-3 group-hover:text-neutral-700 group-hover:translate-x-0.5 transition" />
    </Link>
  );
}