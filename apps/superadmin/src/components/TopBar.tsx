'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { api } from '@/lib/api';

export function TopBar() {
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
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-end px-6 gap-4">
      <span className="text-sm text-neutral-600">{email}</span>
      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 text-sm text-neutral-700 hover:text-neutral-900 transition"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </header>
  );
}