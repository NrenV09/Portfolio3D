'use client';

import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { ActId } from '@/lib/portfolio-types';

interface TopBarProps {
  ownerName: string;
  activeAct: ActId;
  useStudioContrast: boolean;
  onNavigateAct: (act: ActId) => void;
  onOpenEditor: () => void;
}

export default function TopBar({
  ownerName,
  activeAct,
  useStudioContrast,
  onNavigateAct,
  onOpenEditor,
}: TopBarProps) {
  const navItems: { act: ActId; label: string }[] = [
    { act: 1, label: 'Overview' },
    { act: 2, label: 'Work' },
    { act: 3, label: 'About' },
    { act: 4, label: 'Contact' },
  ];

  const textPrimary = useStudioContrast ? 'text-zinc-950' : 'text-white';
  const navInactive = useStudioContrast
    ? 'text-zinc-600 hover:text-zinc-950'
    : 'text-zinc-400 hover:text-white';
  const navActive = useStudioContrast
    ? 'text-zinc-950 border-b-2 border-zinc-950'
    : 'text-white border-b-2 border-emerald-400';
  const headerSurface = useStudioContrast
    ? 'bg-white/85 border-zinc-900/10'
    : 'bg-[#050507]/85 border-white/10';
  const ctaClass = useStudioContrast
    ? 'bg-zinc-950 text-white hover:bg-zinc-800'
    : 'bg-white text-zinc-950 hover:bg-zinc-200';

  return (
    <header
      className={`fixed top-0 inset-x-0 z-30 border-b transition-colors duration-300 ${headerSurface}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-14 sm:h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigateAct(1)}
          className={`font-display font-bold text-base sm:text-lg tracking-tight whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-sm ${textPrimary}`}
        >
          {ownerName}
        </button>

        {/* Zone 2: Clean Typography Nav Links */}
        <nav
          aria-label="Portfolio sections"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {navItems.map((item) => (
            <button
              key={item.act}
              type="button"
              onClick={() => onNavigateAct(item.act)}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                activeAct === item.act ? navActive : navInactive
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenEditor}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${ctaClass}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Customize Portfolio</span>
          </button>
        </div>
      </div>
    </header>
  );
}
