'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { OwnerSidebar } from '@/components/OwnerSidebar';
import { OwnerTopBar } from '@/components/OwnerTopBar';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await api.get('/auth/me');
        if (!cancelled) setChecking(false);
      } catch {
        if (!cancelled) router.replace('/login');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-sm text-neutral-500">Verifying session…</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-neutral-50">
      <OwnerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <OwnerTopBar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}