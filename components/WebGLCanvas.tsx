'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { ActId, PortfolioData } from '@/lib/portfolio-types';
import { getActFromProgress, getCurvedPanelLayout } from '@/lib/portfolio-logic';
import {
  HERO_GRID_FRAGMENT,
  HERO_GRID_VERTEX,
  MONOLITH_FRAGMENT,
  MONOLITH_VERTEX,
  POST_FRAGMENT,
  POST_VERTEX,
} from '@/lib/webgl/shaders';
import {
  createBrushedSurfaceTexture,
  createCurvedPlaneGeometry,
  createHalftoneMonolithTexture,
  createProjectPanelTexture,
  paintGalleryScreens,
} from '@/lib/webgl/textures';

interface WebGLCanvasProps {
  portfolioData: PortfolioData;
  isDarkMode: boolean;
  warpStrength: number;
  isExhibitionOpen: boolean;
  selectedProjectIndex: number;
  hoveredProjectIndex: number;
  exhibitionPulseTick: number;
  onActChange: (act: ActId, title: string) => void;
  onSelectProject: (index: number) => void;
  onHoverProject: (index: number) => void;
  onCoordsChange?: (x: number, y: number) => void;
}

const TRAIL_COUNT = 24;

// Pre-allocated colors (zero GC inside animation loop)
const COLOR_VOID = new THREE.Color('#050507');
const COLOR_DARK_STUDIO = new THREE.Color('#0D1017');
const COLOR_LIGHT_STUDIO = new THREE.Color('#EAEAEA');
const COLOR_CORRIDOR = new THREE.Color('#07090F');
const COLOR_ALLEY = new THREE.Color('#130305');
const TEMP_BG = new THREE.Color();
const TEMP_SCALE = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export default function WebGLCanvas({
  portfolioData,
  isDarkMode,
  warpStrength,
  isExhibitionOpen,
  selectedProjectIndex,
  hoveredProjectIndex,
  exhibitionPulseTick,
  onActChange,
  onSelectProject,
  onHoverProject,
  onCoordsChange,
}: WebGLCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);

  // Sync latest React props into mutable refs so the WebGL loop never restarts
  const dataRef = useRef(portfolioData);
  const darkModeRef = useRef(isDarkMode);
  const warpRef = useRef(warpStrength);
  const exhibitionOpenRef = useRef(isExhibitionOpen);
  const selectedProjRef = useRef(selectedProjectIndex);
  const hoveredProjRef = useRef(hoveredProjectIndex);
  const pulseValueRef = useRef(0);

  const callbacksRef = useRef({
    onActChange,
    onSelectProject,
    onHoverProject,
    onCoordsChange,
  });

  useEffect(() => {
    dataRef.current = portfolioData;
  }, [portfolioData]);

  useEffect(() => {
    darkModeRef.current = isDarkMode;
  }, [isDarkMode]);

  useEffect(() => {
    warpRef.current = warpStrength;
  }, [warpStrength]);

  useEffect(() => {
    exhibitionOpenRef.current = isExhibitionOpen;
  }, [isExhibitionOpen]);

  useEffect(() => {
    selectedProjRef.current = selectedProjectIndex;
  }, [selectedProjectIndex]);

  useEffect(() => {
    hoveredProjRef.current = hoveredProjectIndex;
  }, [hoveredProjectIndex]);

  useEffect(() => {
    callbacksRef.current = {
      onActChange,
      onSelectProject,
      onHoverProject,
      onCoordsChange,
    };
  }, [onActChange, onSelectProject, onHoverProject, onCoordsChange]);

  useEffect(() => {
    if (exhibitionPulseTick > 0) {
      pulseValueRef.current = 1.0;
    }
  }, [exhibitionPulseTick]);

  // Ref for rebuilding dynamic project panels & gallery textures without remounting WebGL
  const sceneHooksRef = useRef<{
    rebuildProjects: () => void;
    refreshGallery: () => void;
    updateAccent: (hex: string) => void;
  } | null>(null);

  useEffect(() => {
    sceneHooksRef.current?.rebuildProjects();
  }, [portfolioData.projects]);

  useEffect(() => {
    sceneHooksRef.current?.refreshGallery();
  }, [portfolioData.projects, portfolioData.profile, selectedProjectIndex, isExhibitionOpen]);

  useEffect(() => {
    sceneHooksRef.current?.updateAccent(portfolioData.profile.accentColor);
  }, [portfolioData.profile.accentColor]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const dpr = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      queueMicrotask(() => setContextLost(true));
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.setAttribute('data-testid', 'webgl-canvas');
    renderer.domElement.setAttribute('aria-label', 'Interactive 3D WebGL Portfolio Scene');

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050507');
    scene.fog = new THREE.FogExp2('#050507', 0.028);

    // Studio Environment Reflection (RoomEnvironment) for realistic metallic PBR surfaces
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 0, 11.5);

    // Three-point warm/cool studio lighting rig
    const hemiLight = new THREE.HemisphereLight('#bfd8ff', '#16141a', 0.8);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#fff5e6', 1.3);
    keyLight.position.set(8, 12, 10);
    scene.add(keyLight);

    const accentPointLight = new THREE.PointLight('#10B981', 0, 35);
    accentPointLight.position.set(0, 2, -25);
    scene.add(accentPointLight);

    const alleyRedLight = new THREE.PointLight('#FF2A1A', 0, 42);
    alleyRedLight.position.set(0, 4, -75);
    scene.add(alleyRedLight);

    const alleyAmberLight = new THREE.PointLight('#FF8800', 0, 35);
    alleyAmberLight.position.set(-4, 2.5, -79);
    scene.add(alleyAmberLight);

    // Shared procedural brushed metal texture
    const brushedTex = createBrushedSurfaceTexture();

    // =========================================================================
    // ACT 1: OBSIDIAN VOID GEODESIC SPHERE, STARFIELD & HALFTONE MONOLITH
    // =========================================================================
    const act1Group = new THREE.Group();
    scene.add(act1Group);

    const initialAccentHex = dataRef.current.profile.accentColor || '#10B981';
    const initialAccent = new THREE.Color(initialAccentHex);

    const heroGridGeo = new THREE.SphereGeometry(22, 44, 32);
    const heroGridMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uOpacity: { value: 1.0 },
        uAccent: { value: initialAccent.clone() },
      },
      vertexShader: HERO_GRID_VERTEX,
      fragmentShader: HERO_GRID_FRAGMENT,
    });
    const heroGridMesh = new THREE.Mesh(heroGridGeo, heroGridMat);
    act1Group.add(heroGridMesh);

    // 3D Geodesic Wireframe Sphere for guaranteed depth & parallax
    const geoBaseIco = new THREE.IcosahedronGeometry(11.5, 2);
    const geodesicWireGeo = new THREE.WireframeGeometry(geoBaseIco);
    geoBaseIco.dispose();
    const geodesicWireMat = new THREE.LineBasicMaterial({
      color: initialAccent.clone(),
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const geodesicSphere = new THREE.LineSegments(geodesicWireGeo, geodesicWireMat);
    geodesicSphere.position.set(0, 0, -1.5);
    act1Group.add(geodesicSphere);

    // 320-point 3D Orbital Particle Starfield
    const particleCount = 320;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const isRing = i < 180;
      if (isRing) {
        const angle = (i / 180) * Math.PI * 2;
        const radius = 5.0 + ((i * 37) % 100) * 0.04;
        particlePositions[i3] = Math.cos(angle) * radius;
        particlePositions[i3 + 1] = Math.sin(angle) * radius * 0.55 + Math.sin(angle * 3) * 0.5;
        particlePositions[i3 + 2] = Math.sin(angle) * 2.2 - 0.8;
      } else {
        const theta = ((i * 137.5) % 360) * (Math.PI / 180);
        const r = 6.5 + ((i * 53) % 100) * 0.085;
        particlePositions[i3] = Math.cos(theta) * r;
        particlePositions[i3 + 1] = (((i * 29) % 100) / 100 - 0.5) * 13;
        particlePositions[i3 + 2] = -1.5 - ((i * 19) % 100) * 0.12;
      }
      const isAccent = i % 3 === 0;
      particleColors[i3] = isAccent ? initialAccent.r : 0.84;
      particleColors[i3 + 1] = isAccent ? initialAccent.g : 0.88;
      particleColors[i3 + 2] = isAccent ? initialAccent.b : 0.96;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    });
    const particleField = new THREE.Points(particleGeo, particleMat);
    act1Group.add(particleField);

    // Orbital Reticle Ring framing the central monolith
    const reticleRingGeo = new THREE.RingGeometry(4.05, 4.18, 72);
    const reticleRingMat = new THREE.MeshBasicMaterial({
      color: initialAccent.clone(),
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const reticleRing = new THREE.Mesh(reticleRingGeo, reticleRingMat);
    reticleRing.position.set(0, 0.1, 1.4);
    act1Group.add(reticleRing);

    // Sculptural Dot-Matrix Halftone Monolith (CanvasTexture + Shader Aura layer)
    let monolithTex = createHalftoneMonolithTexture(initialAccentHex);
    const monolithGeo = new THREE.PlaneGeometry(5.6, 7.0);
    const monolithMat = new THREE.MeshBasicMaterial({
      map: monolithTex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const monolithMesh = new THREE.Mesh(monolithGeo, monolithMat);
    monolithMesh.position.set(0, 0.15, 2.5);
    monolithMesh.renderOrder = 3;
    act1Group.add(monolithMesh);

    const monolithAuraGeo = new THREE.PlaneGeometry(6.6, 8.0, 20, 20);
    const monolithAuraMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uOpacity: { value: 0.55 },
        uAccent: { value: initialAccent.clone() },
      },
      vertexShader: MONOLITH_VERTEX,
      fragmentShader: MONOLITH_FRAGMENT,
    });
    const monolithAuraMesh = new THREE.Mesh(monolithAuraGeo, monolithAuraMat);
    monolithAuraMesh.position.set(0, 0.15, 1.85);
    act1Group.add(monolithAuraMesh);

    // =========================================================================
    // ACT 2: CURVED 3D PROJECT SHOWCASE PLANES
    // =========================================================================
    const act2Group = new THREE.Group();
    act2Group.position.set(0, 0, -22);
    scene.add(act2Group);

    const curvedGeo = createCurvedPlaneGeometry(5.6, 3.7, 22, 10, 9.5);
    const projectMeshes: THREE.Mesh[] = [];
    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    function rebuildProjectPanels() {
      // Dispose old meshes & textures cleanly
      projectMeshes.forEach((m) => {
        act2Group.remove(m);
        const mat = m.material as THREE.MeshBasicMaterial;
        mat.map?.dispose();
        mat.dispose();
      });
      projectMeshes.length = 0;

      const projects = dataRef.current.projects;
      projects.forEach((proj, idx) => {
        const tex = createProjectPanelTexture(proj, idx, maxAnisotropy);
        const mat = new THREE.MeshBasicMaterial({
          map: tex,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(curvedGeo, mat);
        const placement = getCurvedPanelLayout(idx, projects.length);
        mesh.position.set(placement.x, placement.y, placement.z);
        mesh.rotation.y = placement.rotY;
        mesh.layers.enable(1);
        mesh.userData = {
          projectIndex: idx,
          baseRotY: placement.rotY,
        };
        act2Group.add(mesh);
        projectMeshes.push(mesh);
      });
    }

    rebuildProjectPanels();

    // =========================================================================
    // ACT 2B: BRUTALIST 3D VIRTUAL EXHIBITION GALLERY ROOM
    // =========================================================================
    const exhibitionGroup = new THREE.Group();
    exhibitionGroup.position.set(22, 0, -24);
    scene.add(exhibitionGroup);

    const roomFloorMat = new THREE.MeshStandardMaterial({
      color: '#090A0E',
      roughness: 0.2,
      metalness: 0.72,
      roughnessMap: brushedTex,
    });
    const roomFloorGeo = new THREE.PlaneGeometry(24, 24);
    const roomFloor = new THREE.Mesh(roomFloorGeo, roomFloorMat);
    roomFloor.rotation.x = -Math.PI / 2;
    roomFloor.position.y = -2.4;
    exhibitionGroup.add(roomFloor);

    const roomWallMat = new THREE.MeshStandardMaterial({
      color: '#11141C',
      roughness: 0.82,
      metalness: 0.18,
    });
    const backWallGeo = new THREE.PlaneGeometry(24, 12);
    const backWall = new THREE.Mesh(backWallGeo, roomWallMat);
    backWall.position.set(0, 3.6, -7.5);
    exhibitionGroup.add(backWall);

    // Architectural Brutalist Benches (3-part composite with base plinth + seat + trim)
    const benchSeatMat = new THREE.MeshStandardMaterial({
      color: '#1C2029',
      roughness: 0.65,
      metalness: 0.25,
    });
    const benchPlinthMat = new THREE.MeshStandardMaterial({
      color: '#0C0E14',
      roughness: 0.3,
      metalness: 0.8,
    });
    const benchSeatGeo = new THREE.BoxGeometry(3.8, 0.34, 1.15);
    const benchPlinthGeo = new THREE.BoxGeometry(3.2, 0.22, 0.85);

    [-2.6, 2.6].forEach((bx) => {
      const benchGroup = new THREE.Group();
      benchGroup.position.set(bx, -2.4, -2.6);
      const plinth = new THREE.Mesh(benchPlinthGeo, benchPlinthMat);
      plinth.position.y = 0.11;
      const seat = new THREE.Mesh(benchSeatGeo, benchSeatMat);
      seat.position.y = 0.39;
      benchGroup.add(plinth, seat);
      exhibitionGroup.add(benchGroup);
    });

    // 3 Glowing Wall Display Screens
    const galleryCanvases = [
      document.createElement('canvas'),
      document.createElement('canvas'),
      document.createElement('canvas'),
    ];
    const galleryTextures = galleryCanvases.map((c, i) => {
      c.width = i === 1 ? 1024 : 640;
      c.height = 640;
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAnisotropy;
      return tex;
    });

    const sideScreenGeo = new THREE.PlaneGeometry(3.4, 3.4);
    const centerScreenGeo = new THREE.PlaneGeometry(5.2, 3.4);

    const screenLeftMesh = new THREE.Mesh(
      sideScreenGeo,
      new THREE.MeshBasicMaterial({ map: galleryTextures[0] })
    );
    screenLeftMesh.position.set(-4.6, 0.35, -7.2);
    screenLeftMesh.rotation.y = 0.14;
    exhibitionGroup.add(screenLeftMesh);

    const screenCenterMesh = new THREE.Mesh(
      centerScreenGeo,
      new THREE.MeshBasicMaterial({ map: galleryTextures[1] })
    );
    screenCenterMesh.position.set(0, 0.35, -7.35);
    exhibitionGroup.add(screenCenterMesh);

    const screenRightMesh = new THREE.Mesh(
      sideScreenGeo,
      new THREE.MeshBasicMaterial({ map: galleryTextures[2] })
    );
    screenRightMesh.position.set(4.6, 0.35, -7.2);
    screenRightMesh.rotation.y = -0.14;
    exhibitionGroup.add(screenRightMesh);

    const gallerySpot = new THREE.PointLight('#ffffff', 1.8, 22);
    gallerySpot.position.set(0, 3.5, -3.5);
    exhibitionGroup.add(gallerySpot);

    function refreshGalleryScreens() {
      const projects = dataRef.current.projects;
      const idx = Math.min(selectedProjRef.current, Math.max(0, projects.length - 1));
      const proj = projects[idx];
      if (!proj) return;
      gallerySpot.color.set(proj.accent);
      paintGalleryScreens(galleryCanvases, galleryTextures, proj, dataRef.current.profile, idx);
    }

    refreshGalleryScreens();

    // =========================================================================
    // ACT 3: CYBERNETIC ROBOTIC ASSEMBLY CORRIDOR
    // =========================================================================
    const act3Group = new THREE.Group();
    act3Group.position.set(0, 0, -45);
    scene.add(act3Group);

    const trackMat = new THREE.MeshStandardMaterial({
      color: '#131720',
      roughness: 0.35,
      metalness: 0.85,
      roughnessMap: brushedTex,
    });
    const trackGeo = new THREE.BoxGeometry(4.4, 0.4, 16);
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.position.set(0, -2.1, -6.5);
    act3Group.add(trackMesh);

    const railMat = new THREE.MeshStandardMaterial({
      color: '#2A3140',
      roughness: 0.25,
      metalness: 0.9,
    });
    const railGeo = new THREE.BoxGeometry(0.14, 0.5, 16);
    [-1.4, 0, 1.4].forEach((rx) => {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(rx, -1.85, -6.5);
      act3Group.add(rail);
    });

    const cubeMat = new THREE.MeshStandardMaterial({
      color: '#10B981',
      emissive: '#10B981',
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });
    const cubeGeo = new THREE.BoxGeometry(0.58, 0.42, 0.58);
    const energyCubes: { mesh: THREE.Mesh; baseZ: number }[] = [];

    for (let i = 0; i < 12; i++) {
      const lane = i % 2 === 0 ? -0.7 : 0.7;
      const cube = new THREE.Mesh(cubeGeo, cubeMat);
      const zOffset = -i * 1.25;
      cube.position.set(lane, -1.65, zOffset);
      act3Group.add(cube);
      energyCubes.push({ mesh: cube, baseZ: zOffset });
    }

    const roboticArms: {
      lowerPivot: THREE.Group;
      upperPivot: THREE.Group;
      side: number;
      phase: number;
    }[] = [];

    const armWhiteMat = new THREE.MeshStandardMaterial({
      color: '#E5E7EB',
      roughness: 0.32,
      metalness: 0.4,
    });
    const armJointMat = new THREE.MeshStandardMaterial({
      color: '#1F242D',
      roughness: 0.4,
      metalness: 0.8,
    });
    const wireColors = ['#EF4444', '#06B6D4', '#F59E0B', '#10B981'];
    const wireMats = wireColors.map((c) => new THREE.MeshBasicMaterial({ color: c }));

    const baseGeo = new THREE.CylinderGeometry(0.45, 0.55, 0.8, 12);
    const lowerArmGeo = new THREE.BoxGeometry(0.38, 1.8, 0.42);
    const wireGeo = new THREE.BoxGeometry(0.1, 1.5, 0.48);
    const jointSphereGeo = new THREE.SphereGeometry(0.28, 12, 12);
    const foreArmGeo = new THREE.BoxGeometry(0.28, 1.5, 0.28);

    for (let row = 0; row < 6; row++) {
      const zPos = -row * 2.5;
      [-1, 1].forEach((side, sIdx) => {
        const armRoot = new THREE.Group();
        armRoot.position.set(side * 3.2, -1.8, zPos);

        const base = new THREE.Mesh(baseGeo, armJointMat);
        base.position.y = 0.4;
        armRoot.add(base);

        const lowerPivot = new THREE.Group();
        lowerPivot.position.y = 0.85;
        const lowerArm = new THREE.Mesh(lowerArmGeo, armWhiteMat);
        lowerArm.position.y = 0.8;
        lowerPivot.add(lowerArm);

        const wire = new THREE.Mesh(wireGeo, wireMats[(row + sIdx) % wireMats.length]);
        wire.position.y = 0.8;
        lowerPivot.add(wire);

        const upperPivot = new THREE.Group();
        upperPivot.position.y = 1.65;
        const jointSphere = new THREE.Mesh(jointSphereGeo, armJointMat);
        upperPivot.add(jointSphere);

        const foreArm = new THREE.Mesh(foreArmGeo, armWhiteMat);
        foreArm.position.set(-side * 0.55, 0.45, 0);
        foreArm.rotation.z = side * 0.85;
        upperPivot.add(foreArm);

        lowerPivot.add(upperPivot);
        armRoot.add(lowerPivot);
        act3Group.add(armRoot);

        roboticArms.push({
          lowerPivot,
          upperPivot,
          side,
          phase: row * 0.65 + sIdx * 1.2,
        });
      });
    }

    // =========================================================================
    // ACT 4: NEON-CRIMSON CYBERPUNK ALLEYWAY
    // =========================================================================
    const act4Group = new THREE.Group();
    act4Group.position.set(0, 0, -75);
    scene.add(act4Group);

    const alleyFloorMat = new THREE.MeshStandardMaterial({
      color: '#120608',
      roughness: 0.16,
      metalness: 0.86,
      roughnessMap: brushedTex,
    });
    const alleyFloorGeo = new THREE.PlaneGeometry(18, 28);
    const alleyFloor = new THREE.Mesh(alleyFloorGeo, alleyFloorMat);
    alleyFloor.rotation.x = -Math.PI / 2;
    alleyFloor.position.set(0, -2.3, -4);
    act4Group.add(alleyFloor);

    const facadeMat = new THREE.MeshStandardMaterial({
      color: '#16080B',
      roughness: 0.7,
      metalness: 0.5,
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: '#090406',
      roughness: 0.4,
      metalness: 0.8,
    });
    const neonRedMat = new THREE.MeshBasicMaterial({ color: '#FF3B2A' });
    const neonAmberMat = new THREE.MeshBasicMaterial({ color: '#FF9F1C' });
    const wallBlockGeo = new THREE.BoxGeometry(2.2, 8.5, 3.0);
    const signHousingGeo = new THREE.BoxGeometry(0.28, 2.4, 0.72);
    const neonStripGeo = new THREE.BoxGeometry(0.08, 2.1, 0.22);
    const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, 9.2, 8);

    for (let i = 0; i < 6; i++) {
      const zBlock = 4 - i * 3.4;
      [-1, 1].forEach((side) => {
        const wallBlock = new THREE.Mesh(wallBlockGeo, facadeMat);
        wallBlock.position.set(side * 4.6, 1.8, zBlock);
        act4Group.add(wallBlock);

        const housing = new THREE.Mesh(signHousingGeo, frameMat);
        housing.position.set(side * 3.42, 0.8 + (i % 2) * 0.9, zBlock);
        act4Group.add(housing);

        const signMat = i % 2 === 0 ? neonRedMat : neonAmberMat;
        const neonSign = new THREE.Mesh(neonStripGeo, signMat);
        neonSign.position.set(side * 3.26, 0.8 + (i % 2) * 0.9, zBlock);
        act4Group.add(neonSign);
      });

      const pipe = new THREE.Mesh(pipeGeo, facadeMat);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(0, 3.8 + (i % 2) * 0.45, zBlock);
      act4Group.add(pipe);
    }

    const endCoreGeo = new THREE.RingGeometry(2.6, 3.1, 48);
    const endCoreMat = new THREE.MeshBasicMaterial({
      color: '#FF3B2A',
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const endCore = new THREE.Mesh(endCoreGeo, endCoreMat);
    endCore.position.set(0, 0.8, -14);
    act4Group.add(endCore);

    const endInnerRingGeo = new THREE.RingGeometry(1.6, 1.75, 48);
    const endInnerRingMat = new THREE.MeshBasicMaterial({
      color: '#FF9F1C',
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const endInnerRing = new THREE.Mesh(endInnerRingGeo, endInnerRingMat);
    endInnerRing.position.set(0, 0.8, -13.9);
    act4Group.add(endInnerRing);

    // =========================================================================
    // POST-PROCESSING FLUID DISPLACEMENT FBO (SKIPPED ON SOFTWARE WEBGL)
    // =========================================================================
    const cursorTrail: THREE.Vector4[] = [];
    for (let i = 0; i < TRAIL_COUNT; i++) {
      cursorTrail.push(new THREE.Vector4(0.5, 0.5, 0, 0));
    }

    const renderTarget = new THREE.WebGLRenderTarget(
      Math.floor(window.innerWidth * dpr),
      Math.floor(window.innerHeight * dpr),
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      }
    );

    const postScene = new THREE.Scene();
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const postMat = new THREE.ShaderMaterial({
      uniforms: {
        uSceneTex: { value: renderTarget.texture },
        uTrail: { value: cursorTrail },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uMouseVel: { value: new THREE.Vector2(0, 0) },
        uTime: { value: 0 },
        uAspect: { value: window.innerWidth / window.innerHeight },
        uWarpStrength: { value: 1.0 },
        uFlash: { value: 0.0 },
      },
      vertexShader: POST_VERTEX,
      fragmentShader: POST_FRAGMENT,
    });
    const postQuadGeo = new THREE.PlaneGeometry(2, 2);
    const postQuad = new THREE.Mesh(postQuadGeo, postMat);
    postScene.add(postQuad);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    sceneHooksRef.current = {
      rebuildProjects: rebuildProjectPanels,
      refreshGallery: refreshGalleryScreens,
      updateAccent: (hex: string) => {
        heroGridMat.uniforms.uAccent.value.set(hex);
        monolithAuraMat.uniforms.uAccent.value.set(hex);
        geodesicWireMat.color.set(hex);
        reticleRingMat.color.set(hex);

        const nextTex = createHalftoneMonolithTexture(hex);
        monolithMat.map = nextTex;
        monolithMat.needsUpdate = true;
        monolithTex.dispose();
        monolithTex = nextTex;

        const c = new THREE.Color(hex);
        const colorAttr = particleGeo.getAttribute('color') as THREE.BufferAttribute;
        for (let i = 0; i < particleCount; i++) {
          if (i % 3 === 0) {
            colorAttr.setXYZ(i, c.r, c.g, c.b);
          }
        }
        colorAttr.needsUpdate = true;
      },
    };

    // =========================================================================
    // INPUT TELEMETRY & RAYCASTING (LAYER 1 ONLY)
    // =========================================================================
    const mouse = new THREE.Vector2(0.5, 0.5);
    const mouseSmooth = new THREE.Vector2(0.5, 0.5);
    const mouseVel = new THREE.Vector2(0, 0);
    const ndcPointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);

    let scrollCurrent = 0;
    let scrollVelocity = 0;
    let exhibitionLerp = 0;
    let currentActReported: ActId = 1;
    let lastCoordsReport = 0;
    let lastReportedCoordX = '0.50';
    let lastReportedCoordY = '0.50';
    let lastRaycastTime = 0;

    const handlePointerMove = (clientX: number, clientY: number) => {
      mouse.x = clientX / Math.max(1, window.innerWidth);
      mouse.y = 1.0 - clientY / Math.max(1, window.innerHeight);

      const now = performance.now();
      if (now - lastRaycastTime > 32 && currentActReported === 2 && !exhibitionOpenRef.current) {
        lastRaycastTime = now;
        ndcPointer.x = (clientX / Math.max(1, window.innerWidth)) * 2 - 1;
        ndcPointer.y = -(clientY / Math.max(1, window.innerHeight)) * 2 + 1;
        raycaster.setFromCamera(ndcPointer, camera);
        const hits = raycaster.intersectObjects(projectMeshes, false);
        const nextHover = hits.length > 0 ? (hits[0].object.userData.projectIndex as number) : -1;
        if (nextHover !== hoveredProjRef.current) {
          callbacksRef.current.onHoverProject(nextHover);
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onCanvasClick = (e: MouseEvent) => {
      if (currentActReported !== 2 || exhibitionOpenRef.current) return;
      ndcPointer.x = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      ndcPointer.y = -(e.clientY / Math.max(1, window.innerHeight)) * 2 + 1;
      raycaster.setFromCamera(ndcPointer, camera);
      const hits = raycaster.intersectObjects(projectMeshes, false);
      if (hits.length > 0) {
        const idx = hits[0].object.userData.projectIndex as number;
        callbacksRef.current.onSelectProject(idx);
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    renderer.domElement.addEventListener('click', onCanvasClick);

    const onResize = () => {
      const w = window.innerWidth;
      const h = Math.max(1, window.innerHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h);
      renderTarget.setSize(Math.floor(w * dpr), Math.floor(h * dpr));
      postMat.uniforms.uAspect.value = w / h;
      if (isSoftwareGl && !disposed) {
        renderer.render(scene, camera);
      }
    };
    window.addEventListener('resize', onResize);

    // =========================================================================
    // ANIMATION LOOP WITH SOFTWARE-WEBGL AFTERDRAW PACING
    // =========================================================================
    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (status === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    function tick() {
      if (disposed) return;

      const delta = Math.min(0.1, clock.getDelta());
      const elapsed = clock.getElapsedTime();

      // Scroll momentum damping (frame-rate independent)
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollTarget = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const prevScroll = scrollCurrent;
      const dampFactor = 1 - Math.exp(-8.5 * delta);
      scrollCurrent += (scrollTarget - scrollCurrent) * dampFactor;
      scrollVelocity = scrollCurrent - prevScroll;
      const p = scrollCurrent;

      // Cursor spring + 24-point trail
      mouseVel.subVectors(mouse, mouseSmooth);
      mouseSmooth.lerp(mouse, 1 - Math.exp(-16 * delta));

      for (let i = TRAIL_COUNT - 1; i > 0; i--) {
        cursorTrail[i].lerp(cursorTrail[i - 1], 0.72);
        cursorTrail[i].z *= 0.92;
        cursorTrail[i].w *= 0.92;
      }
      cursorTrail[0].set(mouseSmooth.x, mouseSmooth.y, mouseVel.x, mouseVel.y);

      // Report Act transitions & throttled coordinates (<= 10Hz)
      const actInfo = getActFromProgress(p);
      if (actInfo.act !== currentActReported) {
        currentActReported = actInfo.act;
        callbacksRef.current.onActChange(actInfo.act, actInfo.title);
      }

      const now = performance.now();
      if (now - lastCoordsReport > 140) {
        lastCoordsReport = now;
        const nextX = mouseSmooth.x.toFixed(2);
        const nextY = mouseSmooth.y.toFixed(2);
        if (nextX !== lastReportedCoordX || nextY !== lastReportedCoordY) {
          lastReportedCoordX = nextX;
          lastReportedCoordY = nextY;
          callbacksRef.current.onCoordsChange?.(mouseSmooth.x, mouseSmooth.y);
        }
      }

      // Scene background & fog interpolation
      const studioColor = darkModeRef.current ? COLOR_DARK_STUDIO : COLOR_LIGHT_STUDIO;
      let flashAmount = 0;

      if (p < 0.22) {
        TEMP_BG.copy(COLOR_VOID);
        (scene.fog as THREE.FogExp2).density = 0.025;
      } else if (p < 0.3) {
        const t = (p - 0.22) / 0.08;
        TEMP_BG.lerpColors(COLOR_VOID, studioColor, t);
        (scene.fog as THREE.FogExp2).density = THREE.MathUtils.lerp(0.025, 0.032, t);
      } else if (p < 0.54) {
        TEMP_BG.copy(studioColor);
        (scene.fog as THREE.FogExp2).density = 0.032;
      } else if (p < 0.62) {
        const t = (p - 0.54) / 0.08;
        TEMP_BG.lerpColors(studioColor, COLOR_CORRIDOR, t);
        (scene.fog as THREE.FogExp2).density = THREE.MathUtils.lerp(0.032, 0.036, t);
      } else if (p < 0.8) {
        TEMP_BG.copy(COLOR_CORRIDOR);
        (scene.fog as THREE.FogExp2).density = 0.036;
      } else if (p < 0.86) {
        const t = (p - 0.8) / 0.06;
        flashAmount = Math.sin(t * Math.PI) * 0.85;
        TEMP_BG.lerpColors(COLOR_CORRIDOR, COLOR_ALLEY, t);
        (scene.fog as THREE.FogExp2).density = 0.042;
      } else {
        TEMP_BG.copy(COLOR_ALLEY);
        (scene.fog as THREE.FogExp2).density = 0.044;
      }

      const targetExh = exhibitionOpenRef.current ? 1 : 0;
      exhibitionLerp += (targetExh - exhibitionLerp) * (1 - Math.exp(-10.5 * delta));
      if (Math.abs(targetExh - exhibitionLerp) < 0.015) {
        exhibitionLerp = targetExh;
      }
      if (exhibitionLerp > 0.01) {
        TEMP_BG.lerp(COLOR_VOID, exhibitionLerp);
      }

      (scene.background as THREE.Color).copy(TEMP_BG);
      (scene.fog as THREE.FogExp2).color.copy(TEMP_BG);

      // Visibility gating keeps off-screen acts culled and eliminates Z-bleeding
      act1Group.visible = p < 0.30;
      act2Group.visible = p > 0.14 && p < 0.64 && exhibitionLerp < 0.35;
      exhibitionGroup.visible = exhibitionLerp > 0.01;
      act3Group.visible = p > 0.46 && p < 0.84;
      act4Group.visible = p > 0.70;

      // Camera choreography
      const parallaxX = (mouseSmooth.x - 0.5) * 1.4;
      const parallaxY = (mouseSmooth.y - 0.5) * 0.9;

      let camX = parallaxX;
      const camY = parallaxY;
      const camZ = 11.5 - p * 86.0;
      let camRoll = 0;

      if (p >= 0.24 && p < 0.56) {
        camX += 0.8;
      }

      if (p >= 0.79 && p <= 0.87) {
        const rollT = (p - 0.79) / 0.08;
        camRoll = Math.sin(rollT * Math.PI) * Math.PI * 0.65;
      }

      const galleryCamX = 22 + parallaxX * 0.6;
      const galleryCamY = 0.2 + parallaxY * 0.4;
      const galleryCamZ = -21.2;

      camera.position.x = THREE.MathUtils.lerp(camX, galleryCamX, exhibitionLerp);
      camera.position.y = THREE.MathUtils.lerp(camY, galleryCamY, exhibitionLerp);
      camera.position.z = THREE.MathUtils.lerp(camZ, galleryCamZ, exhibitionLerp);
      camera.rotation.z = THREE.MathUtils.lerp(camRoll, 0, exhibitionLerp);
      camera.rotation.y = THREE.MathUtils.lerp(
        -parallaxX * 0.06,
        -parallaxX * 0.08,
        exhibitionLerp
      );
      camera.rotation.x = THREE.MathUtils.lerp(parallaxY * 0.05, parallaxY * 0.05, exhibitionLerp);

      // Act 1 updates
      heroGridMat.uniforms.uTime.value = elapsed;
      heroGridMat.uniforms.uMouse.value.copy(mouseSmooth);
      monolithAuraMat.uniforms.uTime.value = elapsed;
      monolithAuraMat.uniforms.uMouse.value.copy(mouseSmooth);
      geodesicSphere.rotation.y = elapsed * 0.09 + (mouseSmooth.x - 0.5) * 0.35;
      geodesicSphere.rotation.x = Math.sin(elapsed * 0.14) * 0.12 + (mouseSmooth.y - 0.5) * 0.25;
      particleField.rotation.y = elapsed * 0.06;
      particleField.rotation.z = Math.sin(elapsed * 0.18) * 0.08;
      reticleRing.rotation.z = -elapsed * 0.15;
      monolithMesh.rotation.y = (mouseSmooth.x - 0.5) * 0.26 + Math.sin(elapsed * 0.7) * 0.04;
      monolithMesh.rotation.x = -(mouseSmooth.y - 0.5) * 0.18;
      monolithAuraMesh.rotation.copy(monolithMesh.rotation);

      // Act 2 curved showcase panels
      const activeHover = hoveredProjRef.current;
      projectMeshes.forEach((mesh, idx) => {
        const isHovered = activeHover === idx;
        const targetScale = isHovered ? 1.07 : 1.0;
        TEMP_SCALE.set(targetScale, targetScale, targetScale);
        mesh.scale.lerp(TEMP_SCALE, 1 - Math.exp(-10 * delta));
        mesh.rotation.x = scrollVelocity * 16.0;
        mesh.rotation.y =
          (mesh.userData.baseRotY as number) +
          Math.sin(elapsed * 0.9 + idx) * 0.04 +
          (isHovered ? 0.12 : 0);
      });

      // Exhibition pulse
      if (pulseValueRef.current > 0) {
        pulseValueRef.current = Math.max(0, pulseValueRef.current - delta * 1.8);
        gallerySpot.intensity = 1.8 + pulseValueRef.current * 2.4;
      }

      // Act 3 robotic corridor animation
      const act3Active = p > 0.5 && p < 0.84;
      accentPointLight.intensity = act3Active ? 2.4 : 0;
      accentPointLight.position.z = camera.position.z - 8;

      energyCubes.forEach(({ mesh, baseZ }) => {
        const travel = (elapsed * 3.2 - baseZ) % 15;
        mesh.position.z = 1 - travel;
      });

      roboticArms.forEach((arm) => {
        const cycle = Math.sin(elapsed * 2.6 + arm.phase);
        arm.lowerPivot.rotation.z = arm.side * (0.28 + cycle * 0.22);
        arm.upperPivot.rotation.z = -arm.side * (0.35 - cycle * 0.3);
        arm.lowerPivot.rotation.y = Math.cos(elapsed * 1.4 + arm.phase) * 0.18;
      });

      // Act 4 alley neon lights
      const act4Active = p > 0.78;
      alleyRedLight.intensity = act4Active ? 3.8 + Math.sin(elapsed * 8.0) * 0.6 : 0;
      alleyAmberLight.intensity = act4Active ? 2.2 + Math.cos(elapsed * 5.0) * 0.4 : 0;

      // Render: direct scene on Software WebGL, FBO Fluid Displacement on GPU
      if (isSoftwareGl) {
        renderer.render(scene, camera);
        afterDraw(tick);
      } else {
        postMat.uniforms.uTime.value = elapsed;
        postMat.uniforms.uMouse.value.copy(mouseSmooth);
        postMat.uniforms.uMouseVel.value.copy(mouseVel);
        postMat.uniforms.uWarpStrength.value =
          warpRef.current * (currentActReported === 4 ? 1.35 : 1.0);
        postMat.uniforms.uFlash.value = flashAmount;

        renderer.setRenderTarget(renderTarget);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        renderer.render(postScene, postCamera);

        frameId = requestAnimationFrame(tick);
      }
    }

    if (isSoftwareGl) {
      tick();
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);

      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('click', onCanvasClick);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      // Dispose all GPU resources cleanly
      heroGridGeo.dispose();
      heroGridMat.dispose();
      geodesicWireGeo.dispose();
      geodesicWireMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      reticleRingGeo.dispose();
      reticleRingMat.dispose();
      monolithTex.dispose();
      monolithGeo.dispose();
      monolithMat.dispose();
      monolithAuraGeo.dispose();
      monolithAuraMat.dispose();
      curvedGeo.dispose();
      projectMeshes.forEach((m) => {
        const mat = m.material as THREE.MeshBasicMaterial;
        mat.map?.dispose();
        mat.dispose();
      });
      roomFloorGeo.dispose();
      roomFloorMat.dispose();
      backWallGeo.dispose();
      roomWallMat.dispose();
      benchSeatGeo.dispose();
      benchSeatMat.dispose();
      benchPlinthGeo.dispose();
      benchPlinthMat.dispose();
      sideScreenGeo.dispose();
      centerScreenGeo.dispose();
      galleryTextures.forEach((t) => t.dispose());
      trackGeo.dispose();
      trackMat.dispose();
      railGeo.dispose();
      railMat.dispose();
      cubeGeo.dispose();
      cubeMat.dispose();
      baseGeo.dispose();
      lowerArmGeo.dispose();
      wireGeo.dispose();
      jointSphereGeo.dispose();
      foreArmGeo.dispose();
      armWhiteMat.dispose();
      armJointMat.dispose();
      wireMats.forEach((m) => m.dispose());
      alleyFloorGeo.dispose();
      alleyFloorMat.dispose();
      wallBlockGeo.dispose();
      facadeMat.dispose();
      frameMat.dispose();
      signHousingGeo.dispose();
      neonStripGeo.dispose();
      neonRedMat.dispose();
      neonAmberMat.dispose();
      pipeGeo.dispose();
      endCoreGeo.dispose();
      endCoreMat.dispose();
      endInnerRingGeo.dispose();
      endInnerRingMat.dispose();
      brushedTex.dispose();
      envTexture.dispose();
      renderTarget.dispose();
      postQuadGeo.dispose();
      postMat.dispose();
      renderer.dispose();
    };
  }, []);

  if (contextLost) {
    return (
      <div
        data-testid="webgl-fallback"
        className="fixed inset-0 z-0 bg-gradient-to-br from-[#050507] via-[#0D111A] to-[#12070A]"
      />
    );
  }

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-0 w-screen h-screen overflow-hidden"
      aria-hidden="true"
    />
  );
}
