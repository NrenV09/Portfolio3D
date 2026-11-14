'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface PreloaderProps {
  ownerName: string;
  skipIntro?: boolean;
  onComplete: () => void;
}

const BOOT_STEPS = [
  { pct: 32, msg: 'Compiling GLSL fluid & halftone shaders' },
  { pct: 68, msg: 'Assembling 3D exhibition & corridor geometry' },
  { pct: 100, msg: 'Pipeline ready' },
];

export default function Preloader({
  ownerName,
  skipIntro = false,
  onComplete,
}: PreloaderProps) {
  const [visible, setVisible] = useState(!skipIntro);
  const [stepIdx, setStepIdx] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const autostartQuery =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('autostart') === '1';

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (skipIntro || autostartQuery || prefersReduced) {
      const immediateTimer = window.setTimeout(() => {
        setVisible(false);
        onCompleteRef.current();
      }, 0);
      return () => window.clearTimeout(immediateTimer);
    }

    const t1 = window.setTimeout(() => setStepIdx(1), 220);
    const t2 = window.setTimeout(() => setStepIdx(2), 460);
    const tDone = window.setTimeout(() => {
      setVisible(false);
      onCompleteRef.current();
    }, 760);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(tDone);
    };
  }, [skipIntro]);

  const currentStep = BOOT_STEPS[Math.min(stepIdx, BOOT_STEPS.length - 1)];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 bg-[#050507] flex flex-col items-center justify-center px-6"
          aria-live="polite"
        >
          <div className="w-full max-w-md flex flex-col items-center text-center">
            <p className="font-mono-tech text-xs tracking-[0.22em] text-zinc-400 uppercase mb-3">
              WebGL2 Shader Pipeline
            </p>
            <h2 className="font-display text-lg sm:text-xl font-semibold tracking-tight text-white mb-6">
              {ownerName}
            </h2>
            <div className="w-full h-[2px] bg-zinc-800 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-emerald-400 transition-all duration-200 ease-out"
                style={{ width: `${currentStep.pct}%` }}
              />
            </div>
            <div className="w-full flex items-center justify-between font-mono-tech text-xs text-zinc-400">
              <span>{currentStep.msg}</span>
              <span>{currentStep.pct}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
