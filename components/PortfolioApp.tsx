'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { ActId, PortfolioData } from '@/lib/portfolio-types';
import {
  DEFAULT_PORTFOLIO,
  WARP_MODES,
  getActScrollTarget,
  loadPortfolioData,
  resetPortfolioData,
  savePortfolioData,
} from '@/lib/portfolio-logic';
import WebGLCanvas from './WebGLCanvas';
import Preloader from './Preloader';
import TopBar from './TopBar';
import BottomDock from './BottomDock';
import ActOverlays from './ActOverlays';
import PortfolioEditorDrawer, { type EditorTab } from './PortfolioEditorDrawer';
import ContactTerminalModal from './ContactTerminalModal';

interface PortfolioAppProps {
  initialSkipIntro?: boolean;
}

export default function PortfolioApp({ initialSkipIntro = false }: PortfolioAppProps) {
  const [portfolioData, setPortfolioData] = useState<PortfolioData>(DEFAULT_PORTFOLIO);
  const [skipIntro] = useState(initialSkipIntro);
  const [activeAct, setActiveAct] = useState<ActId>(1);
  const [actTitle, setActTitle] = useState('Act 01 · Obsidian Void & Halftone Monolith');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [warpIndex, setWarpIndex] = useState(0);
  const [isExhibitionOpen, setIsExhibitionOpen] = useState(false);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [hoveredProjectIndex, setHoveredProjectIndex] = useState(-1);
  const [exhibitionPulseTick, setExhibitionPulseTick] = useState(0);
  const [coords, setCoords] = useState({ x: 0.5, y: 0.5 });

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>('identity');

  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactInitialMsg, setContactInitialMsg] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Hydrate persisted portfolio from localStorage on client mount
  useEffect(() => {
    const id = window.setTimeout(() => {
      const saved = loadPortfolioData();
      setPortfolioData(saved);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  // Sync dark mode class on <html>
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDarkMode);
    }
  }, [isDarkMode]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = window.setTimeout(() => setToastMsg(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toastMsg]);

  const navigateToAct = useCallback((act: ActId) => {
    setIsExhibitionOpen(false);
    const targetProgress = getActScrollTarget(act);
    const maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    window.scrollTo({
      top: maxScroll * targetProgress,
      behavior: 'smooth',
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isContactOpen) {
          setIsContactOpen(false);
          return;
        }
        if (isEditorOpen) {
          setIsEditorOpen(false);
          return;
        }
        if (isExhibitionOpen) {
          setIsExhibitionOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isContactOpen, isEditorOpen, isExhibitionOpen]);

  const handleOpenProject = useCallback((idx: number) => {
    setSelectedProjectIndex(idx);
    setIsExhibitionOpen(true);
    setExhibitionPulseTick((t) => t + 1);
  }, []);

  const handleSwitchExhibition = useCallback(
    (delta: number) => {
      const len = Math.max(1, portfolioData.projects.length);
      setSelectedProjectIndex((prev) => (prev + delta + len) % len);
      setExhibitionPulseTick((t) => t + 1);
    },
    [portfolioData.projects.length]
  );

  const handleSavePortfolio = useCallback((nextData: PortfolioData) => {
    setPortfolioData(nextData);
    savePortfolioData(nextData);
    setSelectedProjectIndex((prev) =>
      Math.min(prev, Math.max(0, nextData.projects.length - 1))
    );
  }, []);

  const handleResetDemo = useCallback(() => {
    const fresh = resetPortfolioData();
    setPortfolioData(fresh);
    setSelectedProjectIndex(0);
    showToast('Restored default showcase');
  }, [showToast]);

  const handleCopyEmail = useCallback(async () => {
    const email = portfolioData.profile.email;
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(true);
      showToast(`Copied ${email}`);
      window.setTimeout(() => setCopiedEmail(false), 2200);
    } catch {
      showToast(`Email: ${email}`);
    }
  }, [portfolioData.profile.email, showToast]);

  const handleCycleWarp = useCallback(() => {
    setWarpIndex((prev) => {
      const next = (prev + 1) % WARP_MODES.length;
      showToast(WARP_MODES[next].label);
      return next;
    });
  }, [showToast]);

  const handleOpenEditor = useCallback((tab: EditorTab = 'identity') => {
    setEditorTab(tab);
    setIsEditorOpen(true);
  }, []);

  const handleOpenContact = useCallback((prefill = '') => {
    setContactInitialMsg(prefill);
    setIsContactOpen(true);
  }, []);

  const handlePreloaderComplete = useCallback(() => {}, []);

  const handleActChange = useCallback((act: ActId, title: string) => {
    setActiveAct(act);
    setActTitle(title);
  }, []);

  const handleCoordsChange = useCallback((x: number, y: number) => {
    setCoords((prev) =>
      Math.abs(prev.x - x) < 0.005 && Math.abs(prev.y - y) < 0.005
        ? prev
        : { x, y }
    );
  }, []);

  const useStudioContrast = activeAct === 2 && !isExhibitionOpen && !isDarkMode;
  const activeWarp = WARP_MODES[warpIndex];

  return (
    <main
      data-act={activeAct}
      data-exhibition={isExhibitionOpen ? 'open' : 'closed'}
      className="relative min-h-screen w-full"
    >
      <Preloader
        ownerName={portfolioData.profile.name}
        skipIntro={skipIntro}
        onComplete={handlePreloaderComplete}
      />

      <WebGLCanvas
        portfolioData={portfolioData}
        isDarkMode={isDarkMode}
        warpStrength={activeWarp.strength}
        isExhibitionOpen={isExhibitionOpen}
        selectedProjectIndex={selectedProjectIndex}
        hoveredProjectIndex={hoveredProjectIndex}
        exhibitionPulseTick={exhibitionPulseTick}
        onActChange={handleActChange}
        onSelectProject={handleOpenProject}
        onHoverProject={setHoveredProjectIndex}
        onCoordsChange={handleCoordsChange}
      />

      {!isExhibitionOpen && (
        <TopBar
          ownerName={portfolioData.profile.name}
          activeAct={activeAct}
          useStudioContrast={useStudioContrast}
          onNavigateAct={navigateToAct}
          onOpenEditor={() => handleOpenEditor('identity')}
        />
      )}

      <ActOverlays
        portfolioData={portfolioData}
        activeAct={activeAct}
        isExhibitionOpen={isExhibitionOpen}
        selectedProjectIndex={selectedProjectIndex}
        useStudioContrast={useStudioContrast}
        copiedEmail={copiedEmail}
        onNavigateAct={navigateToAct}
        onOpenProject={handleOpenProject}
        onCloseExhibition={() => setIsExhibitionOpen(false)}
        onSwitchExhibition={handleSwitchExhibition}
        onHoverProject={setHoveredProjectIndex}
        onPulseExhibition={() => {
          setExhibitionPulseTick((t) => t + 1);
          showToast('Gallery lights pulsed');
        }}
        onOpenEditor={handleOpenEditor}
        onOpenContactModal={handleOpenContact}
        onCopyEmail={handleCopyEmail}
      />

      {!isExhibitionOpen && (
        <BottomDock
          activeAct={activeAct}
          actTitle={actTitle}
          warpMode={activeWarp}
          isDarkMode={isDarkMode}
          useStudioContrast={useStudioContrast}
          coords={coords}
          onNavigateAct={navigateToAct}
          onCycleWarp={handleCycleWarp}
          onToggleDarkMode={() => setIsDarkMode((d) => !d)}
        />
      )}

      {isEditorOpen && (
        <PortfolioEditorDrawer
          isOpen={isEditorOpen}
          initialTab={editorTab}
          portfolioData={portfolioData}
          onClose={() => setIsEditorOpen(false)}
          onSaveData={handleSavePortfolio}
          onResetDemo={handleResetDemo}
          onNotify={showToast}
        />
      )}

      {isContactOpen && (
        <ContactTerminalModal
          isOpen={isContactOpen}
          profile={portfolioData.profile}
          initialMessage={contactInitialMsg}
          onClose={() => setIsContactOpen(false)}
          onSubmitted={showToast}
        />
      )}

      {/* Notification Toast */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-lg bg-white text-zinc-950 text-xs font-semibold shadow-2xl"
        >
          {toastMsg}
        </div>
      )}

      {/* Scroll Spacer driving the 4-Act 3D Camera Path */}
      <div style={{ height: '650vh', width: '100%', pointerEvents: 'none' }} aria-hidden="true" />
    </main>
  );
}
