// Schema for the auto-movie compositor. The native Swift module reads
// these objects and renders via AVFoundation. Adding a new template
// (e.g. IG / Reels styles, planned for v2) requires only a new object
// here — no native code changes. See SPEC.md §3 and §7.

export type AspectRatio = '1:1' | '9:16' | '16:9';

export type RhythmMode = 'fixed' | 'beat-sync' | 'random';

export type TransitionType = 'cut' | 'fade' | 'wipe' | 'zoom';

export type EffectType = 'ken-burns' | 'parallax' | 'tilt' | 'none';

export type CaptionStyle = 'subtitle' | 'centered' | 'lower-third';

export type CaptionAppearance = 'fade' | 'pop' | 'typewriter';

export interface Transition {
  type: TransitionType;
  durationMs?: number;
  /** Relative pick weight; transitions are sampled per cut. */
  weight: number;
}

export interface Effect {
  type: EffectType;
  /** 0..1, generally subtle. */
  intensity: number;
}

export interface CaptionSpec {
  style: CaptionStyle;
  font: string;
  sizePt: number;
  /** Hex like #ffffff. */
  color: string;
  strokeColor?: string;
  appearance: CaptionAppearance;
}

export interface StickerSpec {
  uri: string;
  /** Normalized 0..1. */
  anchor: { x: number; y: number };
  appearAtMs: number;
  durationMs: number;
}

export interface MovieTemplate {
  id: string;
  /** Localized display name. */
  name: string;
  aspectRatio: AspectRatio;
  resolution: { w: number; h: number };
  rhythm: {
    mode: RhythmMode;
    minClipMs: number;
    maxClipMs: number;
  };
  transitions: Transition[];
  effects: Effect[];
  /** v2 reserve; v1 keeps null. */
  captions: CaptionSpec | null;
  /** v2 reserve. */
  stickers?: StickerSpec[];
}

export interface ComposeAssetInput {
  /** PHAsset localIdentifier from expo-media-library Asset.id. */
  id: string;
  kind: 'photo' | 'video';
}

export interface ComposeRequest {
  assets: ComposeAssetInput[];
  template: MovieTemplate;
  musicUri?: string;
  /** 0 = match music duration; otherwise capped by template duration logic. */
  outputDurationMs: number;
}

export interface ComposeResult {
  uri: string;
  durationMs: number;
  width: number;
  height: number;
}
