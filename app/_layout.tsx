import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useOnboardingStore } from '@/store/onboarding-store';

export default function RootLayout() {
  const seen = useOnboardingStore((s) => s.seen);
  const load = useOnboardingStore((s) => s.load);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (seen === null) return;
    const onOnboarding = segments[0] === 'onboarding';
    if (!seen && !onOnboarding) {
      router.replace('/onboarding');
    }
  }, [seen, segments, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="photo/index"
          options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }}
        />
        <Stack.Screen name="album/[id]" options={{ headerBackTitle: '返回' }} />
        <Stack.Screen name="collection/[id]" options={{ headerBackTitle: '返回' }} />
        <Stack.Screen
          name="movie/composer"
          options={{ presentation: 'modal', title: '剪片' }}
        />
        <Stack.Screen
          name="movie/preview"
          options={{ presentation: 'modal', title: '預覽', headerShown: false }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
