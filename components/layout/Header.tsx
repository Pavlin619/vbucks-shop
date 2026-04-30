'use client';

import { useState } from 'react';
import { ShoppingCart, Zap, Menu, X } from 'lucide-react';
import Link from 'next/link';

const NAV_LINKS = [
  { label: 'Fortnite', href: '#fortnite' },
  { label: 'Item Shop', href: '#item-shop' },
  { label: 'Xbox', href: '#xbox' },
  { label: 'Roblox', href: '#roblox' },
  { label: 'Как Работи', href: '#how-it-works' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between"
        style={{ backgroundColor: 'rgba(1, 22, 39, 0.9)', backdropFilter: 'blur(8px)' }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#ff3366' }}
          >
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg hidden sm:block" style={{ color: '#f6f7f8' }}>
            VBucks Shop
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm transition-colors hover:text-[#ff3366]"
              style={{ color: '#f6f7f8' }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Cart + mobile toggle */}
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors hover:bg-[#e62958]"
            style={{ backgroundColor: '#ff3366', color: '#f6f7f8' }}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Количка (0)</span>
          </button>

          <button
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: '#f6f7f8' }}
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden px-4 pb-4 flex flex-col gap-3"
          style={{ backgroundColor: 'rgba(1, 22, 39, 0.97)' }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="py-2 text-sm transition-colors hover:text-[#ff3366]"
              style={{ color: '#f6f7f8' }}
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
