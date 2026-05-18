import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
