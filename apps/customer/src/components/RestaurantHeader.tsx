'use client';

import { MapPin } from 'lucide-react';

interface Props {
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

export function RestaurantHeader({ restaurant, table }: Props) {
  return (
    <header className="bg-white border-b border-neutral-200">
      <div className="px-5 py-5">
        <div className="mb-3">
          <h1 className="text-xl font-semibold text-neutral-900 truncate">
            {restaurant.name}
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">Dine-in ordering</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 text-white text-xs font-medium">
            <MapPin className="w-3 h-3" />
            Table {table.tableNumber}
            {table.displayName && ` · ${table.displayName}`}
          </span>
        </div>
      </div>
    </header>
  );
}