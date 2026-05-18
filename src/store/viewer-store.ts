import { create } from 'zustand';
import type { Asset } from '@/features/library/safe-media';

type ViewerStore = {
  assets: Asset[];
  index: number;
  open: (assets: Asset[], index: number) => void;
  setIndex: (index: number) => void;
  close: () => void;
};

export const useViewerStore = create<ViewerStore>((set) => ({
  assets: [],
  index: 0,
  open: (assets, index) => set({ assets, index }),
  setIndex: (index) => set({ index }),
  close: () => set({ assets: [], index: 0 }),
}));
