'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Zap, Menu, X, CircleUser } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useCart } from '@/contexts/CartContext';
import Button from '@/components/ui/Button';

const NAV_LINKS = [
  { label: 'Fortnite', href: '#fortnite' },
  { label: 'Item Shop', href: '/item-shop' },
  { label: 'Xbox', href: '#xbox' },
  { label: 'Roblox', href: '#roblox' },
  { label: 'Как Работи', href: '#how-it-works' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems } = useCart();
  const { isSignedIn } = useUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between bg-brand-overlay backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-accent">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg hidden sm:block text-brand-text">
            VBucks Shop
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-brand-text transition-colors hover:text-brand-accent"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            as="link"
            href="/cart"
            size="sm"
            data-testid="cart-link"
            className="relative"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>
              Количка (<span data-testid="cart-count">{totalItems}</span>)
            </span>
          </Button>

          {isSignedIn ? (
            <Button
              as="link"
              href="/profile"
              variant="secondary"
              size="sm"
              aria-label="Профил"
            >
              <CircleUser className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              as="link"
              href="/sign-in"
              size="sm"
            >
              Вход
            </Button>
          )}

          <button
            className="md:hidden p-2 rounded-lg text-brand-text transition-colors hover:bg-white/10"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 flex flex-col gap-3 bg-brand-overlay">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="py-2 text-sm text-brand-text transition-colors hover:text-brand-accent"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
