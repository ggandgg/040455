import { NativeModule, requireOptionalNativeModule } from 'expo';
import type { MovieTemplate } from '@/types/movie';

export type ComposeAssetInput = { id: string; kind: 'photo' | 'video' };

export type ComposeResult = {
  uri: string;
  durationMs: number;
  width: number;
  height: number;
};

export type ComposeRequest = {
  assets: ComposeAssetInput[];
  template: MovieTemplate;
  musicUri?: string;
  outputDurationMs: number;
};

type Events = {
  onProgress: (event: { value: number }) => void;
};

declare class MovieMakerNative extends NativeModule<Events> {
  compose(request: ComposeRequest): Promise<ComposeResult>;
}

const NativeMovieMaker = requireOptionalNativeModule<MovieMakerNative>('MovieMaker');

export const isMovieMakerAvailable = NativeMovieMaker != null;

export type ProgressListener = (progress: number) => void;

export async function composeMovie(
  request: ComposeRequest,
  onProgress?: ProgressListener,
): Promise<ComposeResult> {
  if (!NativeMovieMaker) {
    throw new Error(
      'MovieMaker native module not loaded. This requires a development build (EAS Build with the local module). It is not available in Expo Go.',
    );
  }
  let sub: { remove: () => void } | undefined;
  if (onProgress) {
    sub = NativeMovieMaker.addListener('onProgress', (e) => onProgress(e.value));
  }
  try {
    return await NativeMovieMaker.compose(request);
  } finally {
    sub?.remove();
  }
}
