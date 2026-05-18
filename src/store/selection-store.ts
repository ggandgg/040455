import { create } from 'zustand';

type SelectionStore = {
  active: boolean;
  ids: Set<string>;
  enter: (initialId?: string) => void;
  exit: () => void;
  toggle: (id: string) => void;
  selectAll: (ids: string[]) => void;
  count: () => number;
  has: (id: string) => boolean;
};

export const useSelectionStore = create<SelectionStore>((set, get) => ({
  active: false,
  ids: new Set(),
  enter: (initialId) =>
    set({
      active: true,
      ids: new Set(initialId ? [initialId] : []),
    }),
  exit: () => set({ active: false, ids: new Set() }),
  toggle: (id) =>
    set((s) => {
      const next = new Set(s.ids);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ids: next };
    }),
  selectAll: (ids) => set({ ids: new Set(ids) }),
  count: () => get().ids.size,
  has: (id) => get().ids.has(id),
}));
