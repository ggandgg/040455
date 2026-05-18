import { create } from 'zustand';

export type LibrarySegment = 'all' | 'favorites' | 'albums';

export type ColumnCount = 2 | 3 | 4 | 5;

type LibraryStore = {
  segment: LibrarySegment;
  columns: ColumnCount;
  setSegment: (s: LibrarySegment) => void;
  setColumns: (c: ColumnCount) => void;
};

export const useLibraryStore = create<LibraryStore>((set) => ({
  segment: 'all',
  columns: 3,
  setSegment: (segment) => set({ segment }),
  setColumns: (columns) => set({ columns }),
}));
