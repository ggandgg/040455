export type BuiltInTrack = {
  id: string;
  name: string;
  vibe: 'upbeat' | 'mellow' | 'cinematic';
  durationSec: number;
};

export const BUILTIN_TRACKS: BuiltInTrack[] = [
  { id: 'silent', name: '無配樂', vibe: 'mellow', durationSec: 0 },
  { id: 'sunrise', name: 'Sunrise（待加入音檔）', vibe: 'upbeat', durationSec: 30 },
  { id: 'shoreline', name: 'Shoreline（待加入音檔）', vibe: 'mellow', durationSec: 45 },
  { id: 'skyline', name: 'Skyline（待加入音檔）', vibe: 'cinematic', durationSec: 60 },
];

export function trackUri(id: string): string | undefined {
  return undefined;
}
