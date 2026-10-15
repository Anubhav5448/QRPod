'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Menu } from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    api
      .get('/superadmin/auth/me')
      .then((res) => setEmail(res.data?.data?.user?.email ?? ''))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/superadmin/auth/logout');
    } catch {
      // ignore
    }
    router.replace('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center px-4 lg:px-6 gap-3 shrink-0">
      {/* Hamburger — only on mobile */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Spacer */}
      <div className="flex-1 min-w-0" />

      {/* Actions */}
      <div className="flex items-center gap-2 lg:gap-4 shrink-0">
        <span className="text-sm text-neutral-600 hidden md:inline truncate max-w-[200px]">
          {email}
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-neutral-700 hover:text-neutral-900 transition p-2 rounded-lg hover:bg-neutral-100"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}