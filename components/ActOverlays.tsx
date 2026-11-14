'use client';

import React from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Mail,
  Send,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import type { ActId, PortfolioData } from '@/lib/portfolio-types';

interface ActOverlaysProps {
  portfolioData: PortfolioData;
  activeAct: ActId;
  isExhibitionOpen: boolean;
  selectedProjectIndex: number;
  useStudioContrast: boolean;
  copiedEmail: boolean;
  onNavigateAct: (act: ActId) => void;
  onOpenProject: (index: number) => void;
  onCloseExhibition: () => void;
  onSwitchExhibition: (delta: number) => void;
  onHoverProject: (index: number) => void;
  onPulseExhibition: () => void;
  onOpenEditor: (initialTab?: 'identity' | 'projects' | 'pillars' | 'io') => void;
  onOpenContactModal: (prefillSubject?: string) => void;
  onCopyEmail: () => void;
}

export default function ActOverlays({
  portfolioData,
  activeAct,
  isExhibitionOpen,
  selectedProjectIndex,
  useStudioContrast,
  copiedEmail,
  onNavigateAct,
  onOpenProject,
  onCloseExhibition,
  onSwitchExhibition,
  onHoverProject,
  onPulseExhibition,
  onOpenEditor,
  onOpenContactModal,
  onCopyEmail,
}: ActOverlaysProps) {
  const { profile, projects, pillars } = portfolioData;
  const activeProject =
    projects[Math.min(selectedProjectIndex, Math.max(0, projects.length - 1))] ||
    projects[0];

  return (
    <>
      {/* ====================================================================
          ACT 1: HERO SECTION (OBSIDIAN VOID & ASCII MONOLITH)
          ==================================================================== */}
      {activeAct === 1 && !isExhibitionOpen && (
      <section
        aria-label="Hero Overview"
        className="fixed inset-0 z-10 flex flex-col justify-center px-5 sm:px-10 pt-20 pb-28 pointer-events-none"
      >
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Identity */}
          <div className="lg:col-span-5 flex flex-col items-start pointer-events-auto">
            <p className="font-mono-tech text-xs tracking-wider text-zinc-400 mb-3">
              {profile.handle}
            </p>
            <h1 className="font-display font-bold text-4xl sm:text-6xl xl:text-7xl tracking-tight leading-[0.98] text-white text-balance mb-4">
              {profile.name}
            </h1>
            <p className="text-base sm:text-lg text-zinc-300 font-medium mb-7 max-w-md">
              {profile.role}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigateAct(2)}
                tabIndex={activeAct === 1 ? 0 : -1}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-200 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <span>Explore Work</span>
                <ArrowDown className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onOpenEditor('identity')}
                tabIndex={activeAct === 1 ? 0 : -1}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg surface-obsidian text-zinc-100 text-sm font-medium hover:bg-white/15 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                <span>Add Your Details</span>
              </button>
            </div>
          </div>

          {/* Center Viewport Open for 3D Halftone Monolith */}
          <div className="hidden lg:block lg:col-span-3 h-56" />

          {/* Right Engineering Manifesto */}
          <div className="lg:col-span-4 flex flex-col lg:items-end pointer-events-auto">
            <div className="surface-obsidian p-6 rounded-2xl max-w-sm w-full">
              <p className="font-mono-tech text-xs text-emerald-400 mb-2">
                01. Core Engineering Directive
              </p>
              <p className="text-sm leading-relaxed text-zinc-200 mb-5">
                {profile.coreDirective}
              </p>
              <div className="pt-4 border-t border-white/10 flex flex-col gap-1.5 text-xs font-mono-tech text-zinc-400">
                <div className="flex items-center justify-between gap-2">
                  <span>{profile.location}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-zinc-200">{profile.availability}</span>
                </div>
                <p className="text-zinc-500">{profile.coordinates}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ====================================================================
          ACT 2: SELECTED WORK (CURVED 3D SHOWCASE PLANES)
          ==================================================================== */}
      {activeAct === 2 && !isExhibitionOpen && (
      <section
        aria-label="Selected Work"
        className="fixed inset-0 z-10 flex flex-col justify-center px-5 sm:px-10 pt-20 pb-28 pointer-events-none"
      >
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 flex flex-col items-start pointer-events-auto">
            <p
              className={`font-mono-tech text-xs mb-2 ${
                useStudioContrast ? 'text-zinc-600' : 'text-zinc-400'
              }`}
            >
              02. Project Archive
            </p>
            <h2
              className={`font-display font-bold text-3xl sm:text-5xl tracking-tight mb-2 text-balance ${
                useStudioContrast ? 'text-zinc-950' : 'text-white'
              }`}
            >
              Selected Work
            </h2>
            <p
              className={`text-sm mb-5 max-w-md ${
                useStudioContrast ? 'text-zinc-600' : 'text-zinc-400'
              }`}
            >
              Select a project card or click any curved 3D display in space to enter its virtual exhibition room.
            </p>

            {/* Interactive Project List */}
            <div className="w-full flex flex-col gap-2.5 max-h-[48vh] overflow-y-auto pr-1">
              {projects.map((proj, idx) => (
                <button
                  key={proj.id}
                  type="button"
                  tabIndex={activeAct === 2 && !isExhibitionOpen ? 0 : -1}
                  onMouseEnter={() => onHoverProject(idx)}
                  onMouseLeave={() => onHoverProject(-1)}
                  onClick={() => onOpenProject(idx)}
                  className={`w-full text-left p-4 rounded-xl transition-transform duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    useStudioContrast
                      ? 'surface-studio text-zinc-950 hover:bg-zinc-950 hover:text-white'
                      : 'surface-obsidian text-white hover:bg-white/10'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-mono-tech opacity-70 mb-1">
                      <span style={{ color: proj.accent }}>{proj.code}</span>
                      <span aria-hidden="true">·</span>
                      <span>{proj.year}</span>
                    </div>
                    <div className="font-display font-semibold text-base sm:text-lg truncate">
                      {proj.title}
                    </div>
                    <div className="text-xs opacity-70 mt-1 truncate">
                      {proj.stack.join(' · ')}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0 opacity-70" aria-hidden="true" />
                </button>
              ))}
            </div>

            <button
              type="button"
              tabIndex={activeAct === 2 && !isExhibitionOpen ? 0 : -1}
              onClick={() => onOpenEditor('projects')}
              className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                useStudioContrast
                  ? 'bg-zinc-950 text-white hover:bg-zinc-800'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Manage Projects ({projects.length})</span>
            </button>
          </div>

          <div className="hidden lg:flex lg:col-span-7 flex-col items-end justify-end" />
        </div>
      </section>
      )}

      {/* ====================================================================
          ACT 2B: 3D VIRTUAL EXHIBITION GALLERY ROOM HUD
          ==================================================================== */}
      {isExhibitionOpen && (
      <section
        aria-label="Project Exhibition Room"
        className="fixed inset-0 z-30 flex flex-col justify-between p-5 sm:p-9 pointer-events-none"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
          <button
            type="button"
            tabIndex={isExhibitionOpen ? 0 : -1}
            onClick={onCloseExhibition}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-zinc-950 text-xs sm:text-sm font-semibold hover:bg-zinc-200 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Exit Exhibition Room</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              tabIndex={isExhibitionOpen ? 0 : -1}
              onClick={() => onSwitchExhibition(-1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg surface-obsidian text-white text-xs font-medium hover:bg-white hover:text-zinc-950 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              tabIndex={isExhibitionOpen ? 0 : -1}
              onClick={() => onSwitchExhibition(1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg surface-obsidian text-white text-xs font-medium hover:bg-white hover:text-zinc-950 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {activeProject && (
          <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-end pointer-events-auto">
            <div className="lg:col-span-7 surface-obsidian p-6 rounded-2xl text-white">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tech mb-2">
                <span style={{ color: activeProject.accent }} className="font-semibold">
                  {activeProject.code}
                </span>
                <span className="text-zinc-400">{activeProject.year}</span>
              </div>
              <h3 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-2.5 text-balance">
                {activeProject.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-300 mb-4">
                {activeProject.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 text-xs text-zinc-200">
                {activeProject.highlights.map((item, hIdx) => (
                  <div
                    key={hIdx}
                    className="p-2.5 rounded-lg bg-white/5 border border-white/10"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="text-xs font-mono-tech text-zinc-400">
                Stack: {activeProject.stack.join(' · ')}
              </div>
            </div>

            <div className="lg:col-span-5 surface-obsidian p-5 rounded-2xl text-white">
              <p className="font-mono-tech text-xs text-zinc-400 mb-2">
                Exhibition Controls
              </p>
              <p className="text-xs leading-relaxed text-zinc-300 mb-4">
                Inspect the three gallery displays showing stack telemetry, architecture waves, and system metrics for this project.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  tabIndex={isExhibitionOpen ? 0 : -1}
                  onClick={onPulseExhibition}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-400 text-zinc-950 text-xs font-semibold hover:bg-emerald-300 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Pulse Gallery Lights</span>
                </button>
                <button
                  type="button"
                  tabIndex={isExhibitionOpen ? 0 : -1}
                  onClick={() =>
                    onOpenContactModal(
                      `Inquiry regarding ${activeProject.title} (${activeProject.code})`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-xs font-medium hover:bg-white hover:text-zinc-950 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Inquire About Project</span>
                </button>
                {activeProject.liveUrl && (
                  <a
                    href={activeProject.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={isExhibitionOpen ? 0 : -1}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-xs font-medium hover:bg-white hover:text-zinc-950 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    <span>Open Link</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
      )}

      {/* ====================================================================
          ACT 3: ABOUT & ENGINEERING PHILOSOPHY (ROBOTIC CORRIDOR)
          ==================================================================== */}
      {activeAct === 3 && !isExhibitionOpen && (
      <section
        aria-label="Engineering Philosophy"
        className="fixed inset-0 z-10 flex flex-col justify-center px-5 sm:px-10 pt-20 pb-28 pointer-events-none"
      >
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 flex flex-col gap-4 pointer-events-auto">
            {pillars.slice(0, 2).map((pillar) => (
              <div key={pillar.id} className="surface-obsidian p-5 rounded-2xl">
                <p
                  className="font-mono-tech text-xs font-semibold mb-1.5"
                  style={{ color: pillar.accentColor }}
                >
                  {pillar.indexLabel}
                </p>
                <h3 className="font-display font-semibold text-lg text-white mb-2">
                  {pillar.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-300">
                  {pillar.summary}
                </p>
              </div>
            ))}
          </div>

          <div className="hidden lg:block lg:col-span-2" />

          <div className="lg:col-span-5 flex flex-col gap-4 pointer-events-auto">
            {pillars[2] && (
              <div className="surface-obsidian p-5 rounded-2xl">
                <p
                  className="font-mono-tech text-xs font-semibold mb-1.5"
                  style={{ color: pillars[2].accentColor }}
                >
                  {pillars[2].indexLabel}
                </p>
                <h3 className="font-display font-semibold text-lg text-white mb-2">
                  {pillars[2].title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-300">
                  {pillars[2].summary}
                </p>
              </div>
            )}

            <div className="surface-obsidian p-4 rounded-2xl flex items-center justify-between gap-3">
              <span className="text-xs font-mono-tech text-zinc-400">
                Customize pillars in Studio Editor
              </span>
              <button
                type="button"
                tabIndex={activeAct === 3 ? 0 : -1}
                onClick={() => onOpenEditor('pillars')}
                className="px-3.5 py-1.5 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white hover:text-zinc-950 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                Edit Philosophy
              </button>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ====================================================================
          ACT 4: CONTACT & UPLINK (NEON-CRIMSON SECTOR)
          ==================================================================== */}
      {activeAct === 4 && !isExhibitionOpen && (
      <section
        aria-label="Contact and Links"
        className="fixed inset-0 z-10 flex flex-col items-center justify-center px-5 sm:px-10 pt-20 pb-28 text-center pointer-events-none"
      >
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center pointer-events-auto">
          <p className="font-mono-tech text-xs text-rose-300 mb-4">
            Direct Contact · {profile.location}
          </p>
          <h2 className="font-display font-bold text-4xl sm:text-6xl tracking-tight leading-[1.02] text-white text-balance mb-5">
            {profile.contactHeadline}
          </h2>
          <p className="text-sm sm:text-base text-zinc-200 max-w-xl mb-8 leading-relaxed">
            {profile.contactSubheadline}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            {profile.githubUrl && (
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={activeAct === 4 ? 0 : -1}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg surface-obsidian text-white text-sm font-semibold hover:bg-white hover:text-zinc-950 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <span>GitHub</span>
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
            )}

            <button
              type="button"
              tabIndex={activeAct === 4 ? 0 : -1}
              onClick={onCopyEmail}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg surface-obsidian text-white text-sm font-semibold hover:bg-white hover:text-zinc-950 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  <span>Email Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  <span>Copy {profile.email}</span>
                </>
              )}
            </button>

            <button
              type="button"
              tabIndex={activeAct === 4 ? 0 : -1}
              onClick={() => onOpenContactModal()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-500 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              <span>Send Message</span>
            </button>
          </div>

          <p className="font-mono-tech text-xs text-zinc-400">
            © 2026 {profile.name} · {profile.location}
          </p>
        </div>
      </section>
      )}
    </>
  );
}
