'use client';

import { CartProvider } from '@/lib/cart-store';

export default function QrTokenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CartProvider>{children}</CartProvider>;
}