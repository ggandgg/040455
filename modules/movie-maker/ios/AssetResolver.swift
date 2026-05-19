import Photos
import UIKit
import AVFoundation

enum AssetKind {
  case photo(UIImage)
  case video(AVAsset)
}

enum AssetError: Error, LocalizedError {
  case notFound(String)
  case loadFailed(String)

  var errorDescription: String? {
    switch self {
    case .notFound(let id): return "Asset not found: \(id)"
    case .loadFailed(let id): return "Failed to load asset: \(id)"
    }
  }
}

final class AssetResolver {
  func resolve(id: String, kind: String, targetSize: CGSize) async throws -> AssetKind {
    let fetch = PHAsset.fetchAssets(withLocalIdentifiers: [id], options: nil)
    guard let asset = fetch.firstObject else { throw AssetError.notFound(id) }

    if kind == "video" || asset.mediaType == .video {
      return .video(try await loadVideo(asset))
    }
    return .photo(try await loadImage(asset, size: targetSize))
  }

  private func loadImage(_ asset: PHAsset, size: CGSize) async throws -> UIImage {
    try await withCheckedThrowingContinuation { cont in
      let opts = PHImageRequestOptions()
      opts.isSynchronous = false
      opts.deliveryMode = .highQualityFormat
      opts.isNetworkAccessAllowed = false
      opts.resizeMode = .exact

      PHImageManager.default().requestImage(
        for: asset,
        targetSize: CGSize(width: size.width * UIScreen.main.scale,
                           height: size.height * UIScreen.main.scale),
        contentMode: .aspectFill,
        options: opts
      ) { image, info in
        if let cancelled = info?[PHImageCancelledKey] as? Bool, cancelled { return }
        if let image = image {
          cont.resume(returning: image)
        } else {
          cont.resume(throwing: AssetError.loadFailed(asset.localIdentifier))
        }
      }
    }
  }

  private func loadVideo(_ asset: PHAsset) async throws -> AVAsset {
    try await withCheckedThrowingContinuation { cont in
      let opts = PHVideoRequestOptions()
      opts.isNetworkAccessAllowed = false
      opts.deliveryMode = .highQualityFormat
      PHImageManager.default().requestAVAsset(forVideo: asset, options: opts) { avAsset, _, _ in
        if let avAsset = avAsset {
          cont.resume(returning: avAsset)
        } else {
          cont.resume(throwing: AssetError.loadFailed(asset.localIdentifier))
        }
      }
    }
  }
}
