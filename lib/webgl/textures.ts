import * as THREE from 'three';
import type { PortfolioProfile, PortfolioProject } from '../portfolio-types';

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return `rgba(16, 185, 129, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function createCurvedPlaneGeometry(
  width: number,
  height: number,
  segX: number,
  segY: number,
  curveRadius: number
): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(width, height, segX, segY);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const angle = x / curveRadius;
    const newX = Math.sin(angle) * curveRadius;
    const newZ = Math.cos(angle) * curveRadius - curveRadius;
    pos.setX(i, newX);
    pos.setZ(i, newZ);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createBrushedSurfaceTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 600; i++) {
      const y = Math.random() * 256;
      const alpha = 0.04 + Math.random() * 0.08;
      ctx.fillStyle = i % 2 === 0 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
      ctx.fillRect(0, y, 256, 1 + Math.random() * 1.5);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

export function createProjectPanelTexture(
  project: PortfolioProject,
  index: number,
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 680;
  const ctx = c.getContext('2d');

  if (ctx) {
    const bgGrad = ctx.createLinearGradient(0, 0, 1024, 680);
    bgGrad.addColorStop(0, '#0B0D14');
    bgGrad.addColorStop(1, '#161A25');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 680);

    // Subtle architectural grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 1024; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 680);
      ctx.stroke();
    }
    for (let y = 0; y <= 680; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Centerpiece procedural geometry visual tailored by index
    ctx.save();
    const pattern = index % 4;
    if (pattern === 0) {
      const nodes = [
        [512, 310],
        [340, 230],
        [680, 220],
        [380, 410],
        [660, 400],
        [510, 170],
        [520, 460],
      ];
      ctx.strokeStyle = hexToRgba(project.accent, 0.48);
      ctx.lineWidth = 2.5;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          ctx.beginPath();
          ctx.moveTo(nodes[i][0], nodes[i][1]);
          ctx.lineTo(nodes[j][0], nodes[j][1]);
          ctx.stroke();
        }
      }
      nodes.forEach(([nx, ny], ni) => {
        ctx.fillStyle = ni === 0 ? project.accent : '#ffffff';
        ctx.beginPath();
        ctx.arc(nx, ny, ni === 0 ? 14 : 8, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (pattern === 1) {
      const colors = [project.accent, '#818CF8', '#34D399', '#F472B6'];
      colors.forEach((col, ci) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(512, 320, 65 + ci * 36, 0, Math.PI * 1.65);
        ctx.stroke();
      });
    } else if (pattern === 2) {
      for (let b = 0; b < 9; b++) {
        const bx = 220 + b * 66;
        ctx.fillStyle =
          b < 4 ? hexToRgba(project.accent, 0.35) : hexToRgba(project.accent, 0.8);
        ctx.fillRect(bx, 255, 48, 125);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, 255, 48, 125);
      }
    } else {
      for (let r = 25; r <= 190; r += 24) {
        ctx.strokeStyle = hexToRgba(project.accent, Math.max(0.15, 1 - r / 210));
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(512, 320, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Header bar
    ctx.fillStyle = project.accent;
    ctx.font = 'bold 22px monospace';
    ctx.fillText(project.code.toUpperCase(), 48, 66);

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '18px monospace';
    ctx.fillText('ENTER 3D EXHIBITION →', 720, 66);

    // Title & stack
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(project.title.slice(0, 30), 48, 572);

    ctx.fillStyle = 'rgba(255,255,255,0.74)';
    ctx.font = '20px monospace';
    ctx.fillText(project.stack.slice(0, 4).join('  ·  '), 48, 622);

    // Border
    ctx.strokeStyle = project.accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 1012, 668);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function paintGalleryScreens(
  canvases: HTMLCanvasElement[],
  textures: THREE.CanvasTexture[],
  project: PortfolioProject,
  profile: PortfolioProfile,
  projectIndex: number
): void {
  // Left Screen: Stack Architecture
  const c0 = canvases[0];
  const ctx0 = c0?.getContext('2d');
  if (c0 && ctx0) {
    ctx0.fillStyle = '#0B0D12';
    ctx0.fillRect(0, 0, 640, 640);
    ctx0.strokeStyle = project.accent;
    ctx0.lineWidth = 4;
    ctx0.strokeRect(12, 12, 616, 616);

    ctx0.fillStyle = project.accent;
    ctx0.font = 'bold 24px monospace';
    ctx0.fillText('STACK ARCHITECTURE', 44, 72);

    project.stack.slice(0, 5).forEach((s, si) => {
      ctx0.fillStyle = '#FFFFFF';
      ctx0.font = '20px monospace';
      ctx0.fillText(`0${si + 1}. ${s.toUpperCase()}`, 44, 150 + si * 72);
      ctx0.fillStyle = 'rgba(255,255,255,0.14)';
      ctx0.fillRect(44, 166 + si * 72, 540, 10);
      ctx0.fillStyle = project.accent;
      ctx0.fillRect(44, 166 + si * 72, Math.min(540, 390 + si * 32), 10);
    });
    textures[0].needsUpdate = true;
  }

  // Center Screen: Hero Exhibition Display
  const c1 = canvases[1];
  const ctx1 = c1?.getContext('2d');
  if (c1 && ctx1) {
    ctx1.fillStyle = '#0F1219';
    ctx1.fillRect(0, 0, 1024, 640);
    ctx1.strokeStyle = '#FFFFFF';
    ctx1.lineWidth = 4;
    ctx1.strokeRect(12, 12, 1000, 616);

    ctx1.fillStyle = project.accent;
    ctx1.font = 'bold 24px monospace';
    ctx1.fillText(`${project.code.toUpperCase()}  ·  ${profile.name.toUpperCase()}`, 54, 80);

    ctx1.fillStyle = '#FFFFFF';
    ctx1.font = 'bold 54px sans-serif';
    ctx1.fillText(project.title.slice(0, 26), 54, 210);

    ctx1.fillStyle = 'rgba(255,255,255,0.75)';
    ctx1.font = '24px monospace';
    ctx1.fillText(project.subtitle.slice(0, 52), 54, 275);

    for (let w = 0; w < 38; w++) {
      const h = 35 + Math.abs(Math.sin(w * 0.45 + projectIndex)) * 130;
      ctx1.fillStyle = w % 3 === 0 ? project.accent : 'rgba(255,255,255,0.85)';
      ctx1.fillRect(54 + w * 24, 540 - h, 14, h);
    }
    textures[1].needsUpdate = true;
  }

  // Right Screen: Author & Runtime Summary
  const c2 = canvases[2];
  const ctx2 = c2?.getContext('2d');
  if (c2 && ctx2) {
    ctx2.fillStyle = '#0B0D12';
    ctx2.fillRect(0, 0, 640, 640);
    ctx2.strokeStyle = project.accent;
    ctx2.lineWidth = 4;
    ctx2.strokeRect(12, 12, 616, 616);

    ctx2.fillStyle = '#FFFFFF';
    ctx2.font = 'bold 24px monospace';
    ctx2.fillText('SYSTEMS PROFILE', 44, 72);

    const metrics: [string, string][] = [
      ['ARCHITECT', profile.name.toUpperCase().slice(0, 22)],
      ['ORIGIN', profile.location.toUpperCase().slice(0, 22)],
      ['TIMELINE', project.year.toUpperCase().slice(0, 22)],
      ['FRAME PACING', '60.0 FPS TARGET'],
    ];

    metrics.forEach(([k, v], mi) => {
      ctx2.fillStyle = 'rgba(255,255,255,0.55)';
      ctx2.font = '18px monospace';
      ctx2.fillText(k, 44, 155 + mi * 105);
      ctx2.fillStyle = project.accent;
      ctx2.font = 'bold 28px sans-serif';
      ctx2.fillText(v, 44, 195 + mi * 105);
    });
    textures[2].needsUpdate = true;
  }
}

export function createHalftoneMonolithTexture(accentHex: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 640;
  const ctx = c.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, 512, 640);

    // Subtle radial backdrop aura behind silhouette
    const glow = ctx.createRadialGradient(256, 290, 20, 256, 290, 250);
    glow.addColorStop(0, hexToRgba(accentHex, 0.22));
    glow.addColorStop(0.6, hexToRgba(accentHex, 0.06));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 512, 640);

    const cols = 42;
    const rows = 54;
    const cellW = 512 / cols;
    const cellH = 640 / rows;

    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const nx = (col + 0.5) / cols - 0.5;
        const ny = 0.5 - (r + 0.5) / rows;

        // Head + jaw + neck + shoulders sculptural silhouette
        const headDist = Math.hypot(nx / 0.2, (ny - 0.19) / 0.24) - 1.0;
        const jawDist = Math.hypot(nx / 0.16, (ny - 0.05) / 0.15) - 1.0;
        const neckDist = Math.max(Math.abs(nx) - 0.08, Math.abs(ny + 0.11) - 0.13);
        const shoulderDist = Math.hypot(nx / 0.43, (ny + 0.38) / 0.26) - 1.0;

        const d = Math.min(headDist, jawDist, neckDist, shoulderDist);
        if (d < 0.1) {
          const rim = Math.exp(-Math.abs(d) * 12);
          const inside = d < 0 ? 0.68 : 0.0;
          const visorBand =
            d < 0 && Math.abs(ny - 0.21) < 0.028 ? 0.5 : 0.0;
          const intensity = Math.min(1, inside + rim * 0.9 + visorBand);

          const edgeFade =
            Math.max(0, 1 - Math.pow(Math.abs(nx) / 0.48, 3)) *
            Math.max(0, 1 - Math.pow(Math.abs(ny) / 0.48, 3));

          const alpha = Math.min(1, intensity * edgeFade);
          if (alpha > 0.06) {
            const radius = (0.18 + intensity * 0.34) * Math.min(cellW, cellH);
            ctx.fillStyle =
              visorBand > 0 || rim > 0.58
                ? hexToRgba(accentHex, Math.min(1, alpha * 1.15))
                : `rgba(241, 245, 249, ${Math.min(1, alpha * 1.1).toFixed(2)})`;
            ctx.beginPath();
            ctx.arc(
              (col + 0.5) * cellW,
              (r + 0.5) * cellH,
              radius,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        }
      }
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
