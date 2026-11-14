export const HERO_GRID_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  uniform float uTime;
  uniform vec2 uMouse;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave = sin(pos.x * 0.25 + uTime * 0.8) * cos(pos.y * 0.25 + uTime * 0.6) * 0.45;
    pos += normal * wave;
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const HERO_GRID_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uOpacity;
  uniform vec3 uAccent;

  void main() {
    vec2 gridUv = vUv * vec2(48.0, 28.0);
    vec2 cell = abs(fract(gridUv - 0.5) - 0.5);
    float lineX = 1.0 - smoothstep(0.0, 0.045, cell.x);
    float lineY = 1.0 - smoothstep(0.0, 0.045, cell.y);
    float grid = max(lineX, lineY);

    vec2 mNorm = (uMouse - 0.5) * 18.0;
    float distToCursor = length(vWorldPos.xy - mNorm);
    float cursorGlow = 1.0 - smoothstep(0.0, 10.0, distToCursor);

    float depthFade = smoothstep(-22.0, 8.0, vWorldPos.z);
    vec3 baseCol = mix(vec3(0.24, 0.28, 0.36), mix(vec3(0.8, 0.95, 1.0), uAccent, 0.45), cursorGlow);
    float alpha = grid * (0.42 + cursorGlow * 0.55) * depthFade * uOpacity;

    gl_FragColor = vec4(baseCol, alpha);
  }
`;

export const MONOLITH_VERTEX = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float tiltX = (uMouse.x - 0.5) * 0.35;
    float tiltY = (uMouse.y - 0.5) * 0.25;
    pos.z += sin(uv.y * 3.14159) * 0.45;
    pos.x += tiltX * uv.y * 0.4;
    pos.y += tiltY * 0.3;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const MONOLITH_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uOpacity;
  uniform vec3 uAccent;

  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  float portraitSDF(vec2 p) {
    p.x -= (uMouse.x - 0.5) * 0.08;
    p.y -= sin(uTime * 1.4) * 0.012;

    vec2 headP = (p - vec2(0.0, 0.22)) / vec2(0.21, 0.27);
    float head = (length(headP) - 1.0) * 0.22;

    vec2 jawP = (p - vec2(0.0, 0.07)) / vec2(0.165, 0.16);
    float jaw = (length(jawP) - 1.0) * 0.16;
    head = smin(head, jaw, 0.08);

    vec2 neckP = abs(p - vec2(0.0, -0.12)) - vec2(0.085, 0.14);
    float neck = length(max(neckP, 0.0)) + min(max(neckP.x, neckP.y), 0.0);

    vec2 shoulderP = (p - vec2(0.0, -0.44)) / vec2(0.46, 0.28);
    float shoulders = (length(shoulderP) - 1.0) * 0.3;

    float body = smin(neck, shoulders, 0.09);
    return smin(head, body, 0.06);
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(0.85, 1.0);

    vec2 mLocal = (uMouse - 0.5) * vec2(0.85, 1.0);
    float mDist = length(p - mLocal);
    float cursorPull = 1.0 - smoothstep(0.0, 0.26, mDist);
    vec2 warpP = p + normalize(p - mLocal + 0.0001) * cursorPull * 0.035;

    vec2 gridRes = vec2(62.0, 76.0);
    vec2 cellId = floor((warpP + 0.5) * gridRes);
    vec2 cellCenter = (cellId + 0.5) / gridRes - 0.5;
    vec2 cellUv = fract((warpP + 0.5) * gridRes) - 0.5;

    float d = portraitSDF(cellCenter);

    float inside = 1.0 - smoothstep(-0.02, 0.015, d);
    float rimGlow = exp(-abs(d) * 26.0);
    float visorScan = (1.0 - smoothstep(0.0, 0.03, abs(cellCenter.y - 0.23))) * inside;
    float scanline = 0.78 + 0.22 * sin(cellCenter.y * 85.0 - uTime * 3.6);

    float intensity = clamp((inside * 0.58 + rimGlow * 1.0 + visorScan * 0.7) * scanline, 0.0, 1.0);

    float dotRadius = mix(0.08, 0.45, intensity);
    float dotDist = max(abs(cellUv.x), abs(cellUv.y));
    float dotMask = 1.0 - smoothstep(max(0.0, dotRadius - 0.05), dotRadius + 0.05, dotDist);

    vec3 col = mix(vec3(0.32, 0.42, 0.48), vec3(0.96, 0.99, 1.0), clamp(rimGlow + visorScan * 0.6, 0.0, 1.0));
    col += uAccent * (1.0 - smoothstep(0.0, 0.26, mDist)) * 0.7;
    col += uAccent * rimGlow * 0.35;

    float edgeFadeX = 1.0 - smoothstep(0.32, 0.48, abs(p.x));
    float edgeFadeY = 1.0 - smoothstep(0.36, 0.49, abs(p.y));
    float alpha = dotMask * (intensity * 0.95 + 0.08) * edgeFadeX * edgeFadeY * uOpacity;

    if (alpha < 0.015) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

export const POST_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const POST_FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D uSceneTex;
  uniform vec4 uTrail[24];
  uniform vec2 uMouse;
  uniform vec2 uMouseVel;
  uniform float uTime;
  uniform float uAspect;
  uniform float uWarpStrength;
  uniform float uFlash;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec2 uv = vUv;
    vec2 totalDisp = vec2(0.0);
    float totalEnergy = 0.0;

    for (int i = 0; i < 24; i++) {
      float age = float(i) / 24.0;
      float decay = pow(1.0 - age, 1.65);

      vec2 nodePos = uTrail[i].xy;
      vec2 nodeVel = uTrail[i].zw;
      float speed = length(nodeVel);

      vec2 diff = uv - nodePos;
      vec2 diffAspect = vec2(diff.x * uAspect, diff.y);
      float dist = length(diffAspect);

      float radius = mix(0.11, 0.24, age);
      float falloff = 1.0 - smoothstep(0.0, radius, dist);

      vec2 drag = nodeVel * falloff * decay * 1.45;
      vec2 perp = vec2(-diffAspect.y, diffAspect.x);
      vec2 swirl = perp * falloff * decay * speed * 2.2;

      float rippleWave = sin(dist * 75.0 - uTime * 9.0 - age * 6.0);
      vec2 ripple = normalize(diffAspect + 0.0001) * rippleWave * falloff * decay * (0.005 + speed * 0.14);

      totalDisp += (drag + swirl + ripple);
      totalEnergy += falloff * decay * (speed * 4.5 + 0.12);
    }

    totalDisp *= uWarpStrength;
    totalEnergy *= uWarpStrength;

    vec2 dispUv = uv - totalDisp;
    vec2 rgbSplit = totalDisp * 0.42;

    float r = texture2D(uSceneTex, clamp(dispUv + rgbSplit, 0.001, 0.999)).r;
    float g = texture2D(uSceneTex, clamp(dispUv, 0.001, 0.999)).g;
    float b = texture2D(uSceneTex, clamp(dispUv - rgbSplit, 0.001, 0.999)).b;

    vec3 color = vec3(r, g, b);

    float crest = clamp(totalEnergy * 0.16, 0.0, 0.35);
    color += vec3(0.75, 0.9, 1.0) * crest * length(totalDisp) * 14.0;

    color = mix(color, vec3(0.92, 0.98, 1.0), clamp(uFlash, 0.0, 0.92));

    float grain = (hash(uv * uTime * 60.0) - 0.5) * 0.022;
    color += grain;

    gl_FragColor = vec4(color, 1.0);
  }
`;
