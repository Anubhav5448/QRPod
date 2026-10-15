'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Grid3x3,
  Receipt,
  Settings,
  Store,
} from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/tables', label: 'Tables & QR', icon: Grid3x3 },
  { href: '/orders', label: 'Orders', icon: Receipt },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface Props {
  className?: string;
  onNavigate?: () => void;
}

export function OwnerSidebar({ className = '', onNavigate }: Props) {
  const pathname = usePathname();

  return (
    <aside
      className={`w-64 bg-neutral-900 text-neutral-300 flex-col ${className}`}
    >
      <div className="h-16 flex items-center gap-2 px-6 border-b border-neutral-800 shrink-0">
        <Store className="w-5 h-5 text-white" />
        <span className="font-semibold text-white">Dashboard</span>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                active
                  ? 'bg-neutral-800 text-white'
                  : 'hover:bg-neutral-800/60 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-neutral-800 shrink-0">
        <p className="text-xs text-neutral-500 px-3">v0.1.0 — Dev</p>
      </div>
    </aside>
  );
}