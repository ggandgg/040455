import { create } from 'zustand';
import type { ComposeResult } from 'movie-maker';
import type { MovieTemplate } from '@/types/movie';
import { BEAT } from '@/features/movie/templates';

export type DraftAsset = { id: string; kind: 'photo' | 'video' };

type ComposerStore = {
  assets: DraftAsset[];
  template: MovieTemplate;
  musicId: string;
  durationSec: number;
  result: ComposeResult | null;

  setAssets: (a: DraftAsset[]) => void;
  setTemplate: (t: MovieTemplate) => void;
  setMusicId: (id: string) => void;
  setDurationSec: (s: number) => void;
  setResult: (r: ComposeResult | null) => void;
  reset: () => void;
};

const initial = {
  assets: [] as DraftAsset[],
  template: BEAT,
  musicId: 'silent',
  durationSec: 30,
  result: null as ComposeResult | null,
};

export const useComposerStore = create<ComposerStore>((set) => ({
  ...initial,
  setAssets: (assets) => set({ assets }),
  setTemplate: (template) => set({ template }),
  setMusicId: (musicId) => set({ musicId }),
  setDurationSec: (durationSec) => set({ durationSec }),
  setResult: (result) => set({ result }),
  reset: () => set(initial),
}));
