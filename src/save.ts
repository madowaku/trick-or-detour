export type Language = 'ja' | 'en';
export interface Save {
  version: 1;
  stars: number[];
  language: Language;
  sound: boolean;
  music: boolean;
  reducedMotion: boolean;
}
export const SAVE_KEY = 'trick-or-detour.v1';
export const emptySave = (): Save => ({
  version: 1,
  stars: Array(10).fill(0),
  language: 'ja',
  sound: true,
  music: true,
  reducedMotion: false,
});
export function loadSave(storage: Pick<Storage, 'getItem'> = localStorage): Save {
  try {
    const raw = JSON.parse(storage.getItem(SAVE_KEY) ?? 'null');
    if (!raw || raw.version !== 1) return emptySave();
    return {
      version: 1,
      stars: Array.from({ length: 10 }, (_, i) =>
        Number.isInteger(raw.stars?.[i]) ? Math.min(3, Math.max(0, raw.stars[i])) : 0,
      ),
      language: raw.language === 'en' ? 'en' : 'ja',
      sound: raw.sound !== false,
      music: raw.music !== false,
      reducedMotion: raw.reducedMotion === true,
    };
  } catch {
    return emptySave();
  }
}
export function writeSave(save: Save, storage: Pick<Storage, 'setItem'> = localStorage): boolean {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}
export function unlocked(save: Save): number {
  const first = save.stars.findIndex((n) => n === 0);
  return first < 0 ? 10 : Math.min(10, first + 1);
}
