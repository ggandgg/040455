import type { MovieTemplate } from '@/types/movie';

// Default output is 9:16 1080×1920 to align with Instagram Reels / TikTok.

const reels = { aspectRatio: '9:16' as const, resolution: { w: 1080, h: 1920 } };

export const BEAT: MovieTemplate = {
  id: 'beat',
  name: '節奏 Beat',
  ...reels,
  rhythm: { mode: 'beat-sync', minClipMs: 400, maxClipMs: 900 },
  transitions: [
    { type: 'cut', weight: 0.7 },
    { type: 'fade', durationMs: 150, weight: 0.3 },
  ],
  effects: [{ type: 'ken-burns', intensity: 0.2 }],
  captions: null,
};

export const MELLOW: MovieTemplate = {
  id: 'mellow',
  name: '柔和 Mellow',
  ...reels,
  rhythm: { mode: 'fixed', minClipMs: 2000, maxClipMs: 3000 },
  transitions: [{ type: 'fade', durationMs: 400, weight: 1 }],
  effects: [{ type: 'ken-burns', intensity: 0.35 }],
  captions: null,
};

export const MIX: MovieTemplate = {
  id: 'mix',
  name: '混合 Mix',
  ...reels,
  rhythm: { mode: 'random', minClipMs: 500, maxClipMs: 2500 },
  transitions: [
    { type: 'cut', weight: 0.4 },
    { type: 'fade', durationMs: 200, weight: 0.3 },
    { type: 'zoom', durationMs: 300, weight: 0.3 },
  ],
  effects: [
    { type: 'ken-burns', intensity: 0.25 },
    { type: 'tilt', intensity: 0.15 },
  ],
  captions: null,
};

// Tokyo travel-vlog inspired cinematic template — fast zoom-blur cuts +
// punched-up color, designed to be a quick first draft that owner then
// refines in CapCut. No captions; v2 may add per-clip text.
export const CINEMATIC: MovieTemplate = {
  id: 'cinematic',
  name: '電影感 Cinematic',
  ...reels,
  rhythm: { mode: 'beat-sync', minClipMs: 300, maxClipMs: 700 },
  transitions: [
    { type: 'zoom', durationMs: 220, weight: 0.55 },
    { type: 'cut', weight: 0.3 },
    { type: 'fade', durationMs: 120, weight: 0.15 },
  ],
  effects: [
    { type: 'ken-burns', intensity: 0.45 },
    { type: 'motion-blur', intensity: 0.55 },
    { type: 'color-grade', intensity: 0.6 },
  ],
  captions: null,
};

export const BUILTIN_TEMPLATES: MovieTemplate[] = [BEAT, MELLOW, MIX, CINEMATIC];
