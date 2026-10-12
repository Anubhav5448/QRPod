'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

import { RestaurantHeader } from '@/components/RestaurantHeader';
import { MenuView } from '@/components/MenuView';
import { StickyCartBar } from '@/components/StickyCartBar';

interface QrResolution {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    currency: string;
  };
  table: {
    id: string;
    tableNumber: string;
    displayName: string | null;
    seats: number | null;
    status: string;
  };
}

export default function QrLandingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      }
    >
      <QrLandingContent />
    </Suspense>
  );
}

function QrLandingContent() {
  const params = useParams<{ qrToken: string }>();
  const qrToken = params.qrToken;

  const [data, setData] = useState<QrResolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!qrToken) return;

    setLoading(true);
    setError(null);
    api
      .get(`/public/qr/${qrToken}`)
      .then((res) => {
        setData(res.data?.data ?? null);
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 404) {
          setError(
            'This QR code is no longer valid. Please ask a staff member for help.',
          );
        } else {
          setError('Something went wrong. Please try scanning again.');
        }
      })
      .finally(() => setLoading(false));
  }, [qrToken]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
        <div className="max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-lg font-semibold text-neutral-900 mb-2">
            Can&apos;t load this table
          </h1>
          <p className="text-sm text-neutral-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <RestaurantHeader restaurant={data.restaurant} table={data.table} />
      <MenuView restaurantId={data.restaurant.id} />
      <StickyCartBar
        currency={data.restaurant.currency}
        qrToken={qrToken}
      />
    </div>
  );
}