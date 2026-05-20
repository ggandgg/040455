import { create } from 'zustand';
import { getDB } from '@/db/client';

const KEY = 'onboarding.seen.v1';

type OnboardingStore = {
  seen: boolean | null;
  load: () => Promise<void>;
  markSeen: () => Promise<void>;
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  seen: null,
  load: async () => {
    try {
      const db = await getDB();
      const row = await db.getFirstAsync<{ value: string }>(
        `SELECT value FROM schema_meta WHERE key = ?;`,
        [KEY],
      );
      set({ seen: row?.value === '1' });
    } catch {
      set({ seen: true });
    }
  },
  markSeen: async () => {
    try {
      const db = await getDB();
      await db.runAsync(
        `INSERT OR REPLACE INTO schema_meta(key, value) VALUES (?, ?);`,
        [KEY, '1'],
      );
    } catch {
    }
    set({ seen: true });
  },
}));
