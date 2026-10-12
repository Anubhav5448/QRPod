'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  ScrollText,
  Shield,
} from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/restaurants', label: 'Restaurants', icon: Store },
  { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-neutral-900 text-neutral-300 flex flex-col">
      {/* Brand */}
      <div className="h-16 flex items-center gap-2 px-6 border-b border-neutral-800">
        <Shield className="w-5 h-5 text-white" />
        <span className="font-semibold text-white">Platform Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + '/');

          return (
            <Link
              key={href}
              href={href}
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

      {/* Footer */}
      <div className="p-3 border-t border-neutral-800">
        <p className="text-xs text-neutral-500 px-3">
          v0.1.0 — Dev
        </p>
      </div>
    </aside>
  );
}