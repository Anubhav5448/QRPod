'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { api } from '@/lib/api';

interface MeResponse {
  user: { id: string; name: string; email: string };
  memberships: Array<{
    memberId: string;
    role: string;
    restaurant: { id: string; name: string; slug: string; status: string };
  }>;
}

export function OwnerTopBar() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    api
      .get('/auth/me')
      .then((res) => setMe(res.data?.data ?? null))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    router.replace('/login');
  };

  const restaurant = me?.memberships?.[0]?.restaurant;

  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6">
      <div className="text-sm">
        {restaurant && (
          <span className="font-medium text-neutral-900">
            {restaurant.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-600">{me?.user?.email}</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-neutral-700 hover:text-neutral-900 transition"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </header>
  );
}