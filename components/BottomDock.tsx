'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Moon, Sun, Waves } from 'lucide-react';
import type { ActId, WarpModeConfig } from '@/lib/portfolio-types';

interface BottomDockProps {
  activeAct: ActId;
  actTitle: string;
  warpMode: WarpModeConfig;
  isDarkMode: boolean;
  useStudioContrast: boolean;
  coords: { x: number; y: number };
  onNavigateAct: (act: ActId) => void;
  onCycleWarp: () => void;
  onToggleDarkMode: () => void;
}

export default function BottomDock({
  activeAct,
  actTitle,
  warpMode,
  isDarkMode,
  useStudioContrast,
  coords,
  onNavigateAct,
  onCycleWarp,
  onToggleDarkMode,
}: BottomDockProps) {
  const [collapsed, setCollapsed] = useState(false);

  const surfaceClass = useStudioContrast
    ? 'surface-studio text-zinc-900'
    : 'surface-obsidian text-zinc-100';

  const subtleBtn = useStudioContrast
    ? 'hover:bg-zinc-900/10 text-zinc-700'
    : 'hover:bg-white/10 text-zinc-300';

  const activePill = useStudioContrast
    ? 'bg-zinc-950 text-white'
    : 'bg-emerald-400 text-zinc-950';

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[min(860px,calc(100vw-24px))] pointer-events-none flex flex-col items-center">
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        aria-expanded={!collapsed}
        className={`pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${surfaceClass}`}
      >
        {collapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Show Controls</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Hide Controls</span>
          </>
        )}
      </button>

      {!collapsed && (
        <div
          className={`pointer-events-auto w-full rounded-xl px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 transition-colors duration-300 ${surfaceClass}`}
        >
          {/* Scene Context & Coordinates */}
          <div className="hidden sm:flex items-center gap-3 text-xs font-mono-tech">
            <span className="font-medium truncate max-w-[240px]">{actTitle}</span>
            <span aria-hidden="true" className="opacity-40">
              ·
            </span>
            <span className="opacity-70">
              {coords.x.toFixed(2)}, {coords.y.toFixed(2)}
            </span>
          </div>

          {/* Act Switcher */}
          <div className="flex items-center gap-1" role="group" aria-label="Scene navigation">
            {([1, 2, 3, 4] as ActId[]).map((act) => (
              <button
                key={act}
                type="button"
                onClick={() => onNavigateAct(act)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono-tech font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  activeAct === act ? activePill : subtleBtn
                }`}
              >
                0{act}
              </button>
            ))}
          </div>

          {/* Shader & Theme Controls */}
          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <button
              type="button"
              onClick={onCycleWarp}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${subtleBtn}`}
            >
              <Waves className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>{warpMode.label}</span>
            </button>

            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={isDarkMode ? 'Switch to studio contrast mode' : 'Switch to dark mode'}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${subtleBtn}`}
            >
              {isDarkMode ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                  <span>Studio</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
