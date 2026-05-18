import { Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import {
  deleteAssets as nativeDeleteAssets,
  resolveLocalUri,
  type Asset,
} from './safe-media';

export async function shareAsset(asset: Asset): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    Alert.alert('無法分享', '此裝置不支援分享功能。');
    return;
  }
  try {
    const uri = await resolveLocalUri(asset);
    await Sharing.shareAsync(uri, {
      mimeType: asset.mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
      dialogTitle: '分享',
    });
  } catch (e) {
    Alert.alert('分享失敗', String((e as Error).message ?? e));
  }
}

export async function shareAssets(assets: Asset[]): Promise<void> {
  if (assets.length === 0) return;
  if (assets.length === 1) {
    await shareAsset(assets[0]!);
    return;
  }
  Alert.alert(
    '多檔分享',
    'iOS 系統 share sheet 一次只能分享一個檔案。將依序開啟分享視窗，每張照片一次。',
    [
      { text: '取消', style: 'cancel' },
      {
        text: '繼續',
        onPress: async () => {
          for (const a of assets) {
            await shareAsset(a);
          }
        },
      },
    ],
  );
}

export async function deleteAssetsAction(assets: Asset[]): Promise<boolean> {
  if (assets.length === 0) return false;
  try {
    return await nativeDeleteAssets(assets.map((a) => a.id));
  } catch (e) {
    Alert.alert('刪除失敗', String((e as Error).message ?? e));
    return false;
  }
}
