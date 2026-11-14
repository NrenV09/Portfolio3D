import type {
  ActId,
  CurvedPanelPlacement,
  PortfolioData,
  PortfolioProfile,
  PortfolioProject,
  ValidationResult,
  WarpModeConfig,
} from './portfolio-types';

export const PORTFOLIO_STORAGE_KEY = 'aetheris_webgl_portfolio_v2';

export const WARP_MODES: WarpModeConfig[] = [
  { key: 'high', label: 'Fluid Warp: High', strength: 1.0 },
  { key: 'extreme', label: 'Fluid Warp: Extreme', strength: 1.85 },
  { key: 'subtle', label: 'Fluid Warp: Subtle', strength: 0.42 },
];

export const ACCENT_SWATCHES = [
  '#10B981', // Emerald
  '#38BDF8', // Cyan
  '#F59E0B', // Amber
  '#F43F5E', // Crimson
  '#A78BFA', // Violet
  '#34D399', // Mint
];

export const DEFAULT_PORTFOLIO: PortfolioData = {
  profile: {
    name: 'Your Name',
    role: 'Creative Systems & WebGL Engineer',
    handle: 'Systems Architecture & Shaders',
    location: 'Your City, Country',
    coordinates: 'LAT 00.0000° N · LON 00.0000° E',
    availability: 'Available for collaboration',
    email: 'hello@your-domain.com',
    githubUrl: 'https://github.com/your-username',
    websiteUrl: 'https://your-domain.com',
    coreDirective:
      'Architecting offline-first P2P applications, WebAssembly pipelines, custom GLSL shaders, and interactive spatial experiences.',
    contactHeadline: "Let's build your next project",
    contactSubheadline:
      'Available for selective systems architecture, interactive WebGL experiences, and high-craft frontend engineering.',
    accentColor: '#10B981',
  },
  projects: [
    {
      id: 'nexus-p2p',
      code: '01. Nexus P2P',
      title: 'Nexus P2P Mesh Topology',
      subtitle: 'Offline-first WebRTC mesh & interactive canvas network topology',
      stack: ['WebRTC', 'HTML5 Canvas', 'Zero-Backend', 'CRDT Sync'],
      accent: '#10B981',
      year: 'Systems Architecture · 2026',
      description:
        'A decentralized, zero-backend peer-to-peer WebRTC mesh discovery engine paired with a 60fps HTML5 Canvas force-directed network visualizer capable of syncing state across local LAN and offline nodes.',
      highlights: [
        'Sub-12ms local WebRTC data-channel handshakes with QR & SDP signaling',
        'Custom spatial quadtree force-directed graph rendering 500+ live peer nodes',
        'Conflict-free replicated data types (CRDTs) for offline state reconciliation',
        'Zero external server dependencies — 100% browser-resident topology engine',
      ],
      liveUrl: 'https://github.com',
      repoUrl: 'https://github.com',
    },
    {
      id: 'quantum-link',
      code: '02. Quantum Link',
      title: 'Quantum Link Android 16',
      subtitle: 'Android 16 dynamic theme & fluid spring-physics system UI',
      stack: ['Android 16', 'Material You', 'Dynamic Color', 'Spring Physics'],
      accent: '#38BDF8',
      year: 'Mobile Systems · 2025',
      description:
        'A next-generation Android 16 system interface and companion bridge engineered around HCT dynamic color extraction, tactile spring physics transitions, and low-latency device telemetry.',
      highlights: [
        'Real-time HCT perceptual color palette generation from live wallpapers',
        'Critically damped spring-physics gesture navigation & morphing containers',
        'Direct ADB & WebUSB hardware bridge for real-time kernel profiling',
        'Zero-jank 120Hz frame pacing across custom system surfaces',
      ],
      liveUrl: 'https://github.com',
      repoUrl: 'https://github.com',
    },
    {
      id: 'wasm-remux',
      code: '03. WASM MKV→MP4',
      title: 'WASM MKV→MP4 Remuxer',
      subtitle: 'Client-side WebAssembly video container remuxer',
      stack: ['WebAssembly', 'FFmpeg.wasm', 'Local-First', 'SharedArrayBuffer'],
      accent: '#F59E0B',
      year: 'WebAssembly Engine · 2025',
      description:
        'A privacy-first, client-side media container remuxer compiled to WebAssembly that repackages multi-gigabyte Matroska streams into browser-native MP4 containers at near-disk I/O speeds without re-encoding.',
      highlights: [
        'Zero video transcoding — lossless bitstream copy remuxing in seconds',
        '100% local execution in browser memory with zero cloud uploads',
        'Streaming chunked reader supporting multi-GB files without memory spikes',
        'Multi-threaded WebWorker orchestration with live bitrate & atom inspector',
      ],
      liveUrl: 'https://github.com',
      repoUrl: 'https://github.com',
    },
    {
      id: 'glsl-kernel',
      code: '04. GLSL & Kernel Lab',
      title: 'GLSL & Kernel Lab',
      subtitle: 'Real-time ripple fragment shaders & rooted ROM builds',
      stack: ['GLSL', 'Linux Kernel', 'Embedded SBC', 'Custom ROMs'],
      accent: '#F43F5E',
      year: 'Low-Level R&D · 2024–2026',
      description:
        'An experimental systems and graphics laboratory combining custom GLSL water-ripple and fluid-displacement fragment shaders with custom-compiled Linux kernels, rooted Android ROMs, and embedded SBC clusters.',
      highlights: [
        'Custom GLSL velocity-field ripple shaders with chromatic dispersion',
        'Custom Linux kernel builds with Schedutil governor & ZRAM tuning',
        'Rooted AOSP ROM builds with Magisk modules & SELinux policy hardening',
        'Headless ARM single-board computer clusters running edge inference',
      ],
      liveUrl: 'https://github.com',
      repoUrl: 'https://github.com',
    },
  ],
  pillars: [
    {
      id: 'pillar-1',
      indexLabel: '01. Offline-First & Zero-Bloat',
      title: 'Deterministic Local Engines',
      summary:
        'Engineering resilient peer-to-peer web applications, local-first WebAssembly pipelines, and deterministic state engines that operate with zero cloud latency.',
      accentColor: '#10B981',
    },
    {
      id: 'pillar-2',
      indexLabel: '02. GPU Shaders & Real-Time Graphics',
      title: 'Tactile WebGL & GLSL Physics',
      summary:
        'Writing custom GLSL fragment and vertex shaders, spring-driven fluid velocity fields, and 60fps hardware-accelerated interfaces with physical momentum.',
      accentColor: '#38BDF8',
    },
    {
      id: 'pillar-3',
      indexLabel: '03. Open-Source & Systems Control',
      title: 'Full-Stack Hardware Ownership',
      summary:
        'From custom Android 16 interfaces and Linux kernel tuning to single-board embedded hardware, maintaining complete architectural control across the stack.',
      accentColor: '#F59E0B',
    },
  ],
};

export function getActFromProgress(progress: number): {
  act: ActId;
  title: string;
} {
  const p = Math.min(1, Math.max(0, progress));
  if (p < 0.24) {
    return { act: 1, title: 'Act 01 · Obsidian Void & Halftone Monolith' };
  }
  if (p < 0.56) {
    return { act: 2, title: 'Act 02 · Selected Work & Curved Showcase' };
  }
  if (p < 0.83) {
    return { act: 3, title: 'Act 03 · Cybernetic Assembly Corridor' };
  }
  return { act: 4, title: 'Act 04 · Neon-Crimson Sector Uplink' };
}

export function getActScrollTarget(act: ActId): number {
  switch (act) {
    case 1:
      return 0;
    case 2:
      return 0.36;
    case 3:
      return 0.68;
    case 4:
      return 0.96;
  }
}

export function getCurvedPanelLayout(
  index: number,
  total: number
): CurvedPanelPlacement {
  const col = index % 2;
  const row = Math.floor(index / 2);
  const rowsTotal = Math.max(1, Math.ceil(total / 2));
  const verticalCenterOffset = ((rowsTotal - 1) * 3.85) / 2;

  return {
    x: 2.35 + col * 5.65,
    y: verticalCenterOffset - row * 3.85 + 0.15,
    z: -1.4 - index * 1.15,
    rotY: -0.24 - col * 0.14,
  };
}

export function validateProfile(profile: PortfolioProfile): ValidationResult {
  const errors: string[] = [];
  if (!profile.name.trim()) {
    errors.push('Full name is required.');
  }
  if (!profile.role.trim()) {
    errors.push('Role or headline title is required.');
  }
  if (!profile.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
    errors.push('A valid contact email address is required.');
  }
  if (!profile.coreDirective.trim()) {
    errors.push('Core bio / engineering directive is required.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateProject(project: PortfolioProject): ValidationResult {
  const errors: string[] = [];
  if (!project.title.trim()) {
    errors.push('Project title is required.');
  }
  if (!project.subtitle.trim()) {
    errors.push('Project subtitle is required.');
  }
  if (!project.description.trim()) {
    errors.push('Project description is required.');
  }
  if (project.stack.length === 0) {
    errors.push('At least one technology stack tag is required.');
  }
  return { valid: errors.length === 0, errors };
}

export function createNewProjectTemplate(existingCount: number): PortfolioProject {
  const num = String(existingCount + 1).padStart(2, '0');
  const swatch = ACCENT_SWATCHES[existingCount % ACCENT_SWATCHES.length];
  return {
    id: `project-${Date.now()}-${existingCount + 1}`,
    code: `${num}. New Project`,
    title: 'Untitled System Architecture',
    subtitle: 'Interactive WebGL & Systems Showcase',
    stack: ['TypeScript', 'WebGL', 'Systems'],
    accent: swatch,
    year: `2026`,
    description:
      'Describe the technical architecture, performance benchmarks, and core engineering breakthrough behind this project.',
    highlights: [
      'Hardware-accelerated 60fps real-time rendering pipeline',
      'Deterministic state architecture with zero runtime bottlenecks',
    ],
    liveUrl: '',
    repoUrl: '',
  };
}

export function parsePortfolioImport(rawJson: string): {
  data: PortfolioData | null;
  error: string | null;
} {
  try {
    const parsed = JSON.parse(rawJson) as Partial<PortfolioData>;
    if (!parsed || typeof parsed !== 'object') {
      return { data: null, error: 'Invalid JSON structure.' };
    }
    if (!parsed.profile || typeof parsed.profile.name !== 'string') {
      return { data: null, error: 'Missing required profile.name field.' };
    }
    if (!Array.isArray(parsed.projects) || parsed.projects.length === 0) {
      return { data: null, error: 'Portfolio must include at least one project.' };
    }

    const sanitized: PortfolioData = {
      profile: {
        ...DEFAULT_PORTFOLIO.profile,
        ...parsed.profile,
      },
      projects: parsed.projects.map((p, idx) => ({
        id: typeof p.id === 'string' && p.id ? p.id : `imported-${idx + 1}`,
        code:
          typeof p.code === 'string' && p.code
            ? p.code
            : `${String(idx + 1).padStart(2, '0')}. ${p.title || 'Project'}`,
        title: typeof p.title === 'string' && p.title ? p.title : 'Untitled Project',
        subtitle: typeof p.subtitle === 'string' ? p.subtitle : 'Technical Case Study',
        stack: Array.isArray(p.stack) && p.stack.length > 0 ? p.stack.map(String) : ['WebGL'],
        accent:
          typeof p.accent === 'string' && /^#[0-9A-Fa-f]{6}$/.test(p.accent)
            ? p.accent
            : ACCENT_SWATCHES[idx % ACCENT_SWATCHES.length],
        year: typeof p.year === 'string' && p.year ? p.year : '2026',
        description:
          typeof p.description === 'string' && p.description
            ? p.description
            : 'Custom portfolio showcase entry.',
        highlights:
          Array.isArray(p.highlights) && p.highlights.length > 0
            ? p.highlights.map(String)
            : ['Production-grade implementation'],
        liveUrl: typeof p.liveUrl === 'string' ? p.liveUrl : '',
        repoUrl: typeof p.repoUrl === 'string' ? p.repoUrl : '',
      })),
      pillars:
        Array.isArray(parsed.pillars) && parsed.pillars.length === 3
          ? parsed.pillars.map((pil, idx) => ({
              ...DEFAULT_PORTFOLIO.pillars[idx],
              ...pil,
            }))
          : DEFAULT_PORTFOLIO.pillars,
    };

    return { data: sanitized, error: null };
  } catch {
    return { data: null, error: 'Malformed JSON syntax. Check brackets and quotes.' };
  }
}

export function loadPortfolioData(): PortfolioData {
  if (typeof window === 'undefined') return DEFAULT_PORTFOLIO;
  try {
    const raw = window.localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (!raw) return DEFAULT_PORTFOLIO;
    const { data } = parsePortfolioImport(raw);
    return data ?? DEFAULT_PORTFOLIO;
  } catch {
    return DEFAULT_PORTFOLIO;
  }
}

export function savePortfolioData(data: PortfolioData): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function resetPortfolioData(): PortfolioData {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(PORTFOLIO_STORAGE_KEY);
    } catch {
      // Ignore storage removal errors
    }
  }
  return DEFAULT_PORTFOLIO;
}
