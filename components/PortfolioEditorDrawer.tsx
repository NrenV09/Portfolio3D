'use client';

import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Download,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { PortfolioData, PortfolioProject } from '@/lib/portfolio-types';
import {
  ACCENT_SWATCHES,
  createNewProjectTemplate,
  parsePortfolioImport,
  validateProfile,
  validateProject,
} from '@/lib/portfolio-logic';

export type EditorTab = 'identity' | 'projects' | 'pillars' | 'io';

interface PortfolioEditorDrawerProps {
  isOpen: boolean;
  initialTab: EditorTab;
  portfolioData: PortfolioData;
  onClose: () => void;
  onSaveData: (nextData: PortfolioData) => void;
  onResetDemo: () => void;
  onNotify: (message: string) => void;
}

export default function PortfolioEditorDrawer({
  isOpen,
  initialTab,
  portfolioData,
  onClose,
  onSaveData,
  onResetDemo,
  onNotify,
}: PortfolioEditorDrawerProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>(initialTab);
  const [draft, setDraft] = useState<PortfolioData>(portfolioData);
  const [editingProjIndex, setEditingProjIndex] = useState(0);
  const [stackInput, setStackInput] = useState(() =>
    portfolioData.projects[0] ? portfolioData.projects[0].stack.join(', ') : ''
  );
  const [highlightsInput, setHighlightsInput] = useState(() =>
    portfolioData.projects[0] ? portfolioData.projects[0].highlights.join('\n') : ''
  );
  const [importText, setImportText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [copiedJson, setCopiedJson] = useState(false);

  if (!isOpen) return null;

  const selectProjectForEdit = (idx: number, currentProjects = draft.projects) => {
    setEditingProjIndex(idx);
    const proj = currentProjects[idx];
    if (proj) {
      setStackInput(proj.stack.join(', '));
      setHighlightsInput(proj.highlights.join('\n'));
    }
  };

  const updateActiveProject = (patch: Partial<PortfolioProject>) => {
    setDraft((prev) => {
      const nextProjects = prev.projects.map((p, i) =>
        i === editingProjIndex ? { ...p, ...patch } : p
      );
      return { ...prev, projects: nextProjects };
    });
  };

  const handleAddProject = () => {
    const newProj = createNewProjectTemplate(draft.projects.length);
    const nextProjects = [...draft.projects, newProj];
    setDraft((prev) => ({ ...prev, projects: nextProjects }));
    selectProjectForEdit(nextProjects.length - 1, nextProjects);
    setErrors([]);
  };

  const handleDeleteProject = (idx: number) => {
    if (draft.projects.length <= 1) {
      setErrors(['At least one project is required for the 3D showcase.']);
      return;
    }
    const nextProjects = draft.projects.filter((_, i) => i !== idx);
    setDraft((prev) => ({ ...prev, projects: nextProjects }));
    const nextIdx = Math.min(idx, nextProjects.length - 1);
    selectProjectForEdit(nextIdx, nextProjects);
    setErrors([]);
  };

  const handleMoveProject = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= draft.projects.length) return;
    const nextProjects = [...draft.projects];
    const [moved] = nextProjects.splice(idx, 1);
    nextProjects.splice(target, 0, moved);
    setDraft((prev) => ({ ...prev, projects: nextProjects }));
    selectProjectForEdit(target, nextProjects);
  };

  const handleApplySave = (e: React.FormEvent) => {
    e.preventDefault();
    const collectedErrors: string[] = [];

    const profileCheck = validateProfile(draft.profile);
    if (!profileCheck.valid) {
      collectedErrors.push(...profileCheck.errors);
    }

    for (let i = 0; i < draft.projects.length; i++) {
      const check = validateProject(draft.projects[i]);
      if (!check.valid) {
        collectedErrors.push(`Project ${i + 1}: ${check.errors.join(' ')}`);
      }
    }

    if (collectedErrors.length > 0) {
      setErrors(collectedErrors);
      return;
    }

    setErrors([]);
    onSaveData(draft);
    onNotify('Portfolio updated and saved locally');
    onClose();
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${draft.profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-portfolio.json`;
    link.click();
    URL.revokeObjectURL(url);
    onNotify('Portfolio JSON exported');
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
      setCopiedJson(true);
      onNotify('Portfolio JSON copied to clipboard');
      window.setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      onNotify('Copy failed — use Download JSON instead');
    }
  };

  const handleImportJson = () => {
    const { data, error } = parsePortfolioImport(importText);
    if (error || !data) {
      setErrors([error || 'Unable to parse portfolio JSON.']);
      return;
    }
    setErrors([]);
    setDraft(data);
    selectProjectForEdit(0, data.projects);
    onSaveData(data);
    onNotify('Portfolio JSON imported and applied');
  };

  const currentProject = draft.projects[editingProjIndex];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-drawer-title"
    >
      <div className="w-full max-w-2xl h-full bg-[#090B10] border-l border-white/15 text-zinc-100 flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
          <div>
            <p className="font-mono-tech text-xs text-emerald-400">
              Portfolio Studio Configurator
            </p>
            <h2 id="editor-drawer-title" className="font-display font-bold text-xl text-white">
              Customize Personal Details
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close portfolio editor"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Portfolio configuration sections"
          className="px-6 py-3 border-b border-white/10 flex items-center gap-2 overflow-x-auto shrink-0"
        >
          {(
            [
              { id: 'identity', label: 'Personal Identity' },
              { id: 'projects', label: `Projects (${draft.projects.length})` },
              { id: 'pillars', label: 'Engineering Philosophy' },
              { id: 'io', label: 'Import & Export' },
            ] as { id: EditorTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                activeTab === tab.id
                  ? 'bg-emerald-400 text-zinc-950'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleApplySave} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {errors.length > 0 && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex flex-col gap-1"
            >
              {errors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}

          {/* TAB 1: PERSONAL IDENTITY */}
          {activeTab === 'identity' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-name" className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    placeholder="e.g. Alex Rivera"
                    value={draft.profile.name}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, name: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/15 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label htmlFor="edit-role" className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Role / Headline Title
                  </label>
                  <input
                    id="edit-role"
                    type="text"
                    placeholder="e.g. Creative Systems & WebGL Engineer"
                    value={draft.profile.role}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, role: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/15 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-handle" className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Discipline Tagline
                  </label>
                  <input
                    id="edit-handle"
                    type="text"
                    placeholder="e.g. Systems Architecture & Shaders"
                    value={draft.profile.handle}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, handle: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/15 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label htmlFor="edit-availability" className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Availability Status
                  </label>
                  <input
                    id="edit-availability"
                    type="text"
                    placeholder="e.g. Available for collaboration"
                    value={draft.profile.availability}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, availability: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/15 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-location" className="block text-xs font-medium text-zinc-300 mb-1.5">
                    City / Location
                  </label>
                  <input
                    id="edit-location"
                    type="text"
                    placeholder="e.g. San Francisco, USA"
                    value={draft.profile.location}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, location: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/15 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label htmlFor="edit-coordinates" className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Coordinates / Subtitle
                  </label>
                  <input
                    id="edit-coordinates"
                    type="text"
                    placeholder="e.g. LAT 37.7749° N · LON 122.4194° W"
                    value={draft.profile.coordinates}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, coordinates: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/15 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-email" className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Contact Email
                  </label>
                  <input
                    id="edit-email"
                    type="email"
                    placeholder="you@domain.com"
                    value={draft.profile.email}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, email: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/15 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label htmlFor="edit-github" className="block text-xs font-medium text-zinc-300 mb-1.5">
                    GitHub / Profile URL
                  </label>
                  <input
                    id="edit-github"
                    type="url"
                    placeholder="https://github.com/your-username"
                    value={draft.profile.githubUrl}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, githubUrl: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/15 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-directive" className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Core Engineering Directive (Hero Bio)
                </label>
                <textarea
                  id="edit-directive"
                  rows={3}
                  placeholder="Summarize your technical focus, systems architecture, and craft..."
                  value={draft.profile.coreDirective}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      profile: { ...prev.profile, coreDirective: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/15 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-contact-headline" className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Contact Section Headline
                  </label>
                  <input
                    id="edit-contact-headline"
                    type="text"
                    placeholder="e.g. Let's build your next project"
                    value={draft.profile.contactHeadline}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, contactHeadline: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/15 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <span className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Shader Monolith Accent Color
                  </span>
                  <div className="flex items-center gap-2 py-1.5">
                    {ACCENT_SWATCHES.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        aria-label={`Select accent color ${hex}`}
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            profile: { ...prev.profile, accentColor: hex },
                          }))
                        }
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          draft.profile.accentColor === hex
                            ? 'border-white scale-110'
                            : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROJECTS SHOWCASE */}
          {activeTab === 'projects' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-400">
                  Projects appear in Act 2 as curved 3D showcase panels and interactive exhibition rooms.
                </p>
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-400 text-zinc-950 text-xs font-semibold hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Add Project</span>
                </button>
              </div>

              {/* Project Selector List */}
              <div className="flex flex-col gap-2">
                {draft.projects.map((proj, idx) => (
                  <div
                    key={proj.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                      idx === editingProjIndex
                        ? 'bg-white/10 border-emerald-400/60'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => selectProjectForEdit(idx)}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="text-xs font-mono-tech text-zinc-400">
                        {proj.code}
                      </div>
                      <div className="font-display font-semibold text-sm text-white truncate">
                        {proj.title}
                      </div>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveProject(idx, -1)}
                        disabled={idx === 0}
                        aria-label={`Move ${proj.title} up`}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveProject(idx, 1)}
                        disabled={idx === draft.projects.length - 1}
                        aria-label={`Move ${proj.title} down`}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(idx)}
                        aria-label={`Delete ${proj.title}`}
                        className="p-1.5 rounded-md text-rose-400 hover:bg-rose-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Project Detail Editor */}
              {currentProject && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label htmlFor="proj-code" className="block text-xs font-medium text-zinc-300 mb-1">
                        Index Label
                      </label>
                      <input
                        id="proj-code"
                        type="text"
                        value={currentProject.code}
                        onChange={(e) => updateActiveProject({ code: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label htmlFor="proj-year" className="block text-xs font-medium text-zinc-300 mb-1">
                        Category & Year
                      </label>
                      <input
                        id="proj-year"
                        type="text"
                        value={currentProject.year}
                        onChange={(e) => updateActiveProject({ year: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="proj-title" className="block text-xs font-medium text-zinc-300 mb-1">
                      Project Title
                    </label>
                    <input
                      id="proj-title"
                      type="text"
                      value={currentProject.title}
                      onChange={(e) => updateActiveProject({ title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label htmlFor="proj-subtitle" className="block text-xs font-medium text-zinc-300 mb-1">
                      Short Subtitle
                    </label>
                    <input
                      id="proj-subtitle"
                      type="text"
                      value={currentProject.subtitle}
                      onChange={(e) => updateActiveProject({ subtitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label htmlFor="proj-stack" className="block text-xs font-medium text-zinc-300 mb-1">
                      Tech Stack (comma-separated)
                    </label>
                    <input
                      id="proj-stack"
                      type="text"
                      value={stackInput}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setStackInput(raw);
                        updateActiveProject({
                          stack: raw
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label htmlFor="proj-desc" className="block text-xs font-medium text-zinc-300 mb-1">
                      Case Study Description
                    </label>
                    <textarea
                      id="proj-desc"
                      rows={3}
                      value={currentProject.description}
                      onChange={(e) => updateActiveProject({ description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label htmlFor="proj-highlights" className="block text-xs font-medium text-zinc-300 mb-1">
                      Key Highlights (one per line)
                    </label>
                    <textarea
                      id="proj-highlights"
                      rows={3}
                      value={highlightsInput}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setHighlightsInput(raw);
                        updateActiveProject({
                          highlights: raw
                            .split('\n')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
                    <div>
                      <label htmlFor="proj-url" className="block text-xs font-medium text-zinc-300 mb-1">
                        Live / Repo URL (optional)
                      </label>
                      <input
                        id="proj-url"
                        type="url"
                        value={currentProject.liveUrl || ''}
                        onChange={(e) => updateActiveProject({ liveUrl: e.target.value })}
                        placeholder="https://github.com/..."
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <span className="block text-xs font-medium text-zinc-300 mb-1">
                        Panel Accent Color
                      </span>
                      <div className="flex items-center gap-2 py-1">
                        {ACCENT_SWATCHES.map((hex) => (
                          <button
                            key={hex}
                            type="button"
                            aria-label={`Set project color ${hex}`}
                            onClick={() => updateActiveProject({ accent: hex })}
                            className={`w-6 h-6 rounded-full border-2 ${
                              currentProject.accent === hex
                                ? 'border-white scale-110'
                                : 'border-transparent opacity-75 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PHILOSOPHY PILLARS */}
          {activeTab === 'pillars' && (
            <div className="flex flex-col gap-4">
              {draft.pillars.map((pillar, idx) => (
                <div
                  key={pillar.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor={`pillar-index-${idx}`}
                        className="block text-xs font-medium text-zinc-300 mb-1"
                      >
                        Pillar Label
                      </label>
                      <input
                        id={`pillar-index-${idx}`}
                        type="text"
                        value={pillar.indexLabel}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            pillars: prev.pillars.map((pl, pi) =>
                              pi === idx ? { ...pl, indexLabel: e.target.value } : pl
                            ),
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`pillar-title-${idx}`}
                        className="block text-xs font-medium text-zinc-300 mb-1"
                      >
                        Pillar Heading
                      </label>
                      <input
                        id={`pillar-title-${idx}`}
                        type="text"
                        value={pillar.title}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            pillars: prev.pillars.map((pl, pi) =>
                              pi === idx ? { ...pl, title: e.target.value } : pl
                            ),
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor={`pillar-summary-${idx}`}
                      className="block text-xs font-medium text-zinc-300 mb-1"
                    >
                      Summary
                    </label>
                    <textarea
                      id={`pillar-summary-${idx}`}
                      rows={2}
                      value={pillar.summary}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          pillars: prev.pillars.map((pl, pi) =>
                            pi === idx ? { ...pl, summary: e.target.value } : pl
                          ),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: IMPORT & EXPORT */}
          {activeTab === 'io' && (
            <div className="flex flex-col gap-5">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
                <h3 className="font-display font-semibold text-base text-white">
                  Backup & Share Portfolio
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Download your customized portfolio configuration as a portable JSON file or copy it to the clipboard.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-200 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Download JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                        <span>Copied JSON</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
                <label htmlFor="import-json-area" className="font-display font-semibold text-base text-white">
                  Import Portfolio JSON
                </label>
                <textarea
                  id="import-json-area"
                  rows={5}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder='Paste exported JSON here (must include "profile" and "projects")...'
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-white/15 text-xs font-mono-tech text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleImportJson}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-400 text-zinc-950 text-xs font-semibold hover:bg-emerald-300 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Load & Apply JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onResetDemo();
                      onClose();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-500/15 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Reset to Demo</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Persistent Drawer Footer */}
          <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-white/15 text-sm text-zinc-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-400 text-zinc-950 text-sm font-semibold hover:bg-emerald-300 transition-colors"
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              <span>Save & Showcase</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
