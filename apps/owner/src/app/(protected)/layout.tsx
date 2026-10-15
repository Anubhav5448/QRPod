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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Close mobile menu on route change / Esc key
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [mobileMenuOpen]);

  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-sm text-neutral-500">Verifying session…</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-neutral-50">
      {/* Desktop sidebar — always visible on lg+ */}
      <OwnerSidebar className="hidden lg:flex" />

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <OwnerSidebar
            className="fixed inset-y-0 left-0 z-50 flex lg:hidden animate-in slide-in-from-left duration-200"
            onNavigate={() => setMobileMenuOpen(false)}
          />
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <OwnerTopBar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}