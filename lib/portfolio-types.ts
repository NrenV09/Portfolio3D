export type ActId = 1 | 2 | 3 | 4;

export type WarpModeKey = 'high' | 'extreme' | 'subtle';

export interface WarpModeConfig {
  key: WarpModeKey;
  label: string;
  strength: number;
}

export interface PortfolioProject {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  stack: string[];
  accent: string;
  year: string;
  description: string;
  highlights: string[];
  liveUrl?: string;
  repoUrl?: string;
}

export interface EngineeringPillar {
  id: string;
  indexLabel: string;
  title: string;
  summary: string;
  accentColor: string;
}

export interface PortfolioProfile {
  name: string;
  role: string;
  handle: string;
  location: string;
  coordinates: string;
  availability: string;
  email: string;
  githubUrl: string;
  websiteUrl: string;
  coreDirective: string;
  contactHeadline: string;
  contactSubheadline: string;
  accentColor: string;
}

export interface PortfolioData {
  profile: PortfolioProfile;
  projects: PortfolioProject[];
  pillars: EngineeringPillar[];
}

export interface CurvedPanelPlacement {
  x: number;
  y: number;
  z: number;
  rotY: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
