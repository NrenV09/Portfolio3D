'use client';

import React, { useState } from 'react';
import { Check, Send, X } from 'lucide-react';
import type { PortfolioProfile } from '@/lib/portfolio-types';

interface ContactTerminalModalProps {
  isOpen: boolean;
  profile: PortfolioProfile;
  initialMessage?: string;
  onClose: () => void;
  onSubmitted: (summary: string) => void;
}

export default function ContactTerminalModal({
  isOpen,
  profile,
  initialMessage = '',
  onClose,
  onSubmitted,
}: ContactTerminalModalProps) {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [scope, setScope] = useState('WebGL / 3D Interactive Experience');
  const [message, setMessage] = useState(initialMessage);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderEmail.trim() || !message.trim()) {
      setError('Please complete your name, return email, and message.');
      return;
    }
    setError(null);
    setSubmitted(true);
    onSubmitted(`Inquiry prepared for ${profile.name}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
    >
      <div className="surface-obsidian w-full max-w-lg rounded-2xl p-6 sm:p-8 text-white">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
          <div>
            <p className="font-mono-tech text-xs text-emerald-400">
              Direct Contact
            </p>
            <h2
              id="contact-modal-title"
              className="font-display font-bold text-xl text-white"
            >
              Message {profile.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close contact dialog"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {error && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="contact-name"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Your Name or Organization
              </label>
              <input
                id="contact-name"
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Alex Chen, Studio X"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/15 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label
                htmlFor="contact-email"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Return Email
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/15 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label
                htmlFor="contact-scope"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Project Scope
              </label>
              <select
                id="contact-scope"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="WebGL / 3D Interactive Experience">
                  WebGL / 3D Interactive Experience
                </option>
                <option value="Offline-First / WebAssembly Architecture">
                  Offline-First / WebAssembly Architecture
                </option>
                <option value="Systems & Mobile Engineering">
                  Systems & Mobile Engineering
                </option>
                <option value="Full-Stack Product Collaboration">
                  Full-Stack Product Collaboration
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Project Details
              </label>
              <textarea
                id="contact-message"
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share timeline, goals, or technical context..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/15 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-white/15 text-sm text-zinc-300 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-400 text-zinc-950 font-semibold text-sm hover:bg-emerald-300 transition-colors"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>Send Message</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 mb-4">
              <Check className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="font-display font-semibold text-lg text-white mb-2">
              Message Ready for {profile.name}
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed mb-6">
              Thanks, {senderName}. Your {scope} inquiry has been logged for {profile.email}.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={`mailto:${encodeURIComponent(profile.email)}?subject=${encodeURIComponent(
                  `[${scope}] Portfolio Inquiry from ${senderName}`
                )}&body=${encodeURIComponent(message)}`}
                className="px-5 py-2.5 rounded-lg bg-emerald-400 text-zinc-950 text-sm font-semibold hover:bg-emerald-300 transition-colors"
              >
                Open Email Client
              </a>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors"
              >
                Return to Portfolio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
