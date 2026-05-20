import AVFoundation
import CoreImage
import CoreImage.CIFilterBuiltins
import UIKit

enum ComposerError: Error, LocalizedError {
  case noAssets
  case writerInit(String)
  case exportFailed(String)
  case audioMuxFailed(String)

  var errorDescription: String? {
    switch self {
    case .noAssets: return "No assets to compose."
    case .writerInit(let m): return "Writer init failed: \(m)"
    case .exportFailed(let m): return "Export failed: \(m)"
    case .audioMuxFailed(let m): return "Audio mux failed: \(m)"
    }
  }
}

final class MovieComposer {
  private let onProgress: (Double) -> Void
  private let resolver = AssetResolver()
  private let frameRate: Int32 = 30
  private let ciContext = CIContext(options: [
    .useSoftwareRenderer: false,
    .workingColorSpace: CGColorSpaceCreateDeviceRGB(),
  ])

  init(onProgress: @escaping (Double) -> Void) {
    self.onProgress = onProgress
  }

  func compose(request: ComposeRequest) async throws -> ComposeResult {
    guard !request.assets.isEmpty else { throw ComposerError.noAssets }

    let width = request.template.resolution.w
    let height = request.template.resolution.h
    let renderSize = CGSize(width: width, height: height)

    let clipMsList = computeClipDurations(
      template: request.template,
      count: request.assets.count,
      totalMs: request.outputDurationMs
    )

    let cutCount = max(0, request.assets.count - 1)
    let transitionTypes = sampleTransitionTypes(template: request.template, cutCount: cutCount)

    let kenBurnsIntensity = effectIntensity(request.template, type: "ken-burns")
    let motionBlurIntensity = effectIntensity(request.template, type: "motion-blur")
    let colorGradeIntensity = effectIntensity(request.template, type: "color-grade")

    let videoOnlyURL = URL(fileURLWithPath: NSTemporaryDirectory())
      .appendingPathComponent("\(UUID().uuidString)-video.mp4")
    try? FileManager.default.removeItem(at: videoOnlyURL)

    let writer: AVAssetWriter
    do {
      writer = try AVAssetWriter(outputURL: videoOnlyURL, fileType: .mp4)
    } catch {
      throw ComposerError.writerInit(error.localizedDescription)
    }

    let videoSettings: [String: Any] = [
      AVVideoCodecKey: AVVideoCodecType.h264,
      AVVideoWidthKey: width,
      AVVideoHeightKey: height,
      AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: 8_000_000,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel
      ]
    ]
    let videoInput = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
    videoInput.expectsMediaDataInRealTime = false

    let bufferAttrs: [String: Any] = [
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
      kCVPixelBufferWidthKey as String: width,
      kCVPixelBufferHeightKey as String: height
    ]
    let adaptor = AVAssetWriterInputPixelBufferAdaptor(
      assetWriterInput: videoInput,
      sourcePixelBufferAttributes: bufferAttrs
    )

    guard writer.canAdd(videoInput) else {
      throw ComposerError.writerInit("cannot add video input")
    }
    writer.add(videoInput)

    writer.startWriting()
    writer.startSession(atSourceTime: .zero)

    var elapsedMs = 0

    for (idx, asset) in request.assets.enumerated() {
      let clipMs = clipMsList[idx]
      let resolved = try await resolver.resolve(id: asset.id, kind: asset.kind, targetSize: renderSize)

      let leadingTransition = idx > 0 ? transitionTypes[idx - 1] : "cut"
      let trailingTransition = idx < transitionTypes.count ? transitionTypes[idx] : "cut"

      let renderImage: UIImage
      switch resolved {
      case .photo(let image):
        renderImage = image
      case .video:
        // Video clips not yet rendered as frames; fall back to black with effects.
        // Full video clip rendering is tracked for a follow-up.
        renderImage = UIImage()
      }

      try await writePhotoClip(
        image: renderImage,
        startMs: elapsedMs,
        durationMs: clipMs,
        renderSize: renderSize,
        adaptor: adaptor,
        input: videoInput,
        leadingTransition: leadingTransition,
        trailingTransition: trailingTransition,
        kenBurnsIntensity: kenBurnsIntensity,
        motionBlurIntensity: motionBlurIntensity,
        colorGradeIntensity: colorGradeIntensity
      )

      elapsedMs += clipMs
      onProgress(min(0.85, Double(idx + 1) / Double(request.assets.count) * 0.8))
    }

    videoInput.markAsFinished()
    await writer.finishWriting()

    if writer.status != .completed {
      throw ComposerError.exportFailed(writer.error?.localizedDescription ?? "writer status \(writer.status.rawValue)")
    }

    onProgress(0.9)

    let finalURL = try await muxAudioIfNeeded(
      videoURL: videoOnlyURL,
      musicUri: request.musicUri,
      totalDurationMs: elapsedMs
    )

    onProgress(1.0)

    return ComposeResult(
      uri: finalURL.absoluteString,
      durationMs: elapsedMs,
      width: width,
      height: height
    )
  }

  // MARK: - Clip rendering

  private func writePhotoClip(
    image: UIImage,
    startMs: Int,
    durationMs: Int,
    renderSize: CGSize,
    adaptor: AVAssetWriterInputPixelBufferAdaptor,
    input: AVAssetWriterInput,
    leadingTransition: String,
    trailingTransition: String,
    kenBurnsIntensity: Double,
    motionBlurIntensity: Double,
    colorGradeIntensity: Double
  ) async throws {
    let frames = max(1, Int(Double(durationMs) * Double(frameRate) / 1000.0))
    let startTimescale: Int32 = 1000
    let startTime = CMTime(value: CMTimeValue(startMs), timescale: startTimescale)

    let fadeFrames = max(1, Int(0.18 * Double(frameRate)))
    let zoomBlurFrames = max(2, Int(0.13 * Double(frameRate)))

    for f in 0..<frames {
      while !input.isReadyForMoreMediaData {
        try? await Task.sleep(nanoseconds: 5_000_000)
      }
      let progress = Double(f) / Double(max(frames - 1, 1))

      // Alpha for fade transitions
      var alpha = 1.0
      if leadingTransition == "fade" && f < fadeFrames {
        alpha = Double(f) / Double(fadeFrames)
      } else if trailingTransition == "fade" && (frames - f) <= fadeFrames {
        alpha = Double(frames - f) / Double(fadeFrames)
      }

      // Extra zoom + motion blur near a zoom cut
      var extraScale = 0.0
      var motionBlurAmount = 0.0
      if leadingTransition == "zoom" && f < zoomBlurFrames {
        let t = 1.0 - Double(f) / Double(zoomBlurFrames)
        extraScale = 0.18 * t
        motionBlurAmount = motionBlurIntensity * t
      } else if trailingTransition == "zoom" && (frames - f) <= zoomBlurFrames {
        let t = Double(zoomBlurFrames - (frames - f)) / Double(zoomBlurFrames)
        extraScale = 0.18 * t
        motionBlurAmount = motionBlurIntensity * t
      }

      guard let buffer = renderPhotoFrame(
        image: image,
        size: renderSize,
        progress: progress,
        kenBurnsIntensity: kenBurnsIntensity,
        extraScale: extraScale,
        motionBlurAmount: motionBlurAmount,
        colorGradeIntensity: colorGradeIntensity,
        alpha: alpha
      ) else { continue }

      let pts = CMTimeAdd(startTime, CMTime(value: CMTimeValue(f), timescale: frameRate))
      adaptor.append(buffer, withPresentationTime: pts)
    }
  }

  private func renderPhotoFrame(
    image: UIImage,
    size: CGSize,
    progress: Double,
    kenBurnsIntensity: Double,
    extraScale: Double,
    motionBlurAmount: Double,
    colorGradeIntensity: Double,
    alpha: Double
  ) -> CVPixelBuffer? {
    let attrs: [CFString: Any] = [
      kCVPixelBufferCGImageCompatibilityKey: true,
      kCVPixelBufferCGBitmapContextCompatibilityKey: true
    ]
    var pb: CVPixelBuffer?
    let status = CVPixelBufferCreate(
      kCFAllocatorDefault,
      Int(size.width), Int(size.height),
      kCVPixelFormatType_32BGRA,
      attrs as CFDictionary,
      &pb
    )
    guard status == kCVReturnSuccess, let buffer = pb else { return nil }

    CVPixelBufferLockBaseAddress(buffer, [])

    guard let context = CGContext(
      data: CVPixelBufferGetBaseAddress(buffer),
      width: Int(size.width),
      height: Int(size.height),
      bitsPerComponent: 8,
      bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
      space: CGColorSpaceCreateDeviceRGB(),
      bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue
        | CGBitmapInfo.byteOrder32Little.rawValue
    ) else {
      CVPixelBufferUnlockBaseAddress(buffer, [])
      return nil
    }

    context.setFillColor(UIColor.black.cgColor)
    context.fill(CGRect(origin: .zero, size: size))

    if let cg = image.cgImage {
      let imgW = CGFloat(cg.width)
      let imgH = CGFloat(cg.height)
      let viewAspect = size.width / size.height
      let imgAspect = imgW / imgH

      var baseSize: CGSize
      if imgAspect > viewAspect {
        baseSize = CGSize(width: size.height * imgAspect, height: size.height)
      } else {
        baseSize = CGSize(width: size.width, height: size.width / imgAspect)
      }

      let totalScale = 1.0 + kenBurnsIntensity * progress + extraScale
      let drawSize = CGSize(width: baseSize.width * CGFloat(totalScale),
                            height: baseSize.height * CGFloat(totalScale))
      let origin = CGPoint(
        x: (size.width - drawSize.width) / 2.0,
        y: (size.height - drawSize.height) / 2.0
      )

      context.saveGState()
      context.setAlpha(CGFloat(max(0.0, min(1.0, alpha))))
      context.translateBy(x: 0, y: size.height)
      context.scaleBy(x: 1, y: -1)
      let flippedOrigin = CGPoint(x: origin.x, y: size.height - origin.y - drawSize.height)
      context.draw(cg, in: CGRect(origin: flippedOrigin, size: drawSize))
      context.restoreGState()
    }

    CVPixelBufferUnlockBaseAddress(buffer, [])

    // Apply Core Image post-processing (color grade, motion blur) if needed.
    let needsCI = colorGradeIntensity > 0.001 || motionBlurAmount > 0.001
    guard needsCI else { return buffer }

    var ci = CIImage(cvPixelBuffer: buffer)
    if colorGradeIntensity > 0.001 {
      ci = applyColorGrade(ci, intensity: colorGradeIntensity)
    }
    if motionBlurAmount > 0.001 {
      ci = applyMotionBlur(ci, amount: motionBlurAmount)
    }

    ciContext.render(ci, to: buffer)
    return buffer
  }

  // MARK: - Effects

  private func applyColorGrade(_ image: CIImage, intensity: Double) -> CIImage {
    // Cinematic look: lifted vibrance, mild contrast bump, warm highlights / cool shadows.
    let saturationBoost = 1.0 + intensity * 0.18
    let contrastBoost = 1.0 + intensity * 0.12

    let controls = CIFilter.colorControls()
    controls.inputImage = image
    controls.saturation = Float(saturationBoost)
    controls.contrast = Float(contrastBoost)
    controls.brightness = 0
    let after1 = controls.outputImage ?? image

    let vibrance = CIFilter.vibrance()
    vibrance.inputImage = after1
    vibrance.amount = Float(intensity * 0.6)
    let after2 = vibrance.outputImage ?? after1

    // Warm highlights / cool shadows via colorMatrix.
    let warmth = CGFloat(intensity * 0.06)
    let matrix = CIFilter.colorMatrix()
    matrix.inputImage = after2
    matrix.rVector = CIVector(x: 1.0 + warmth, y: 0, z: 0, w: 0)
    matrix.gVector = CIVector(x: 0, y: 1.0, z: 0, w: 0)
    matrix.bVector = CIVector(x: 0, y: 0, z: 1.0 - warmth * 0.6, w: 0)
    matrix.aVector = CIVector(x: 0, y: 0, z: 0, w: 1)
    matrix.biasVector = CIVector(x: 0, y: 0, z: 0, w: 0)
    return matrix.outputImage ?? after2
  }

  private func applyMotionBlur(_ image: CIImage, amount: Double) -> CIImage {
    let blur = CIFilter.motionBlur()
    blur.inputImage = image
    blur.radius = Float(amount * 30.0)
    blur.angle = 0
    // CIMotionBlur outputs an image with infinite extent; clamp back to original.
    let blurred = blur.outputImage ?? image
    return blurred.cropped(to: image.extent)
  }

  // MARK: - Transition sampling

  private func sampleTransitionTypes(template: TemplateSpec, cutCount: Int) -> [String] {
    guard cutCount > 0 else { return [] }
    let transitions = template.transitions
    guard !transitions.isEmpty else {
      return Array(repeating: "cut", count: cutCount)
    }
    let totalWeight = transitions.reduce(0.0) { $0 + max(0, $1.weight) }
    guard totalWeight > 0 else {
      return Array(repeating: transitions[0].type, count: cutCount)
    }
    return (0..<cutCount).map { _ in
      var pick = Double.random(in: 0..<totalWeight)
      for t in transitions {
        let w = max(0, t.weight)
        if pick < w { return t.type }
        pick -= w
      }
      return transitions.last?.type ?? "cut"
    }
  }

  private func effectIntensity(_ template: TemplateSpec, type: String) -> Double {
    return template.effects.first { $0.type == type }?.intensity ?? 0.0
  }

  private func computeClipDurations(template: TemplateSpec, count: Int, totalMs: Int) -> [Int] {
    let minMs = template.rhythm.minClipMs
    let maxMs = template.rhythm.maxClipMs
    if totalMs > 0 {
      let perClip = max(minMs, min(maxMs, totalMs / max(count, 1)))
      return Array(repeating: perClip, count: count)
    }
    switch template.rhythm.mode {
    case "random":
      return (0..<count).map { _ in Int.random(in: minMs...maxMs) }
    case "beat-sync":
      return Array(repeating: (minMs + maxMs) / 2, count: count)
    default:
      return Array(repeating: (minMs + maxMs) / 2, count: count)
    }
  }

  // MARK: - Audio mux

  private func muxAudioIfNeeded(
    videoURL: URL,
    musicUri: String?,
    totalDurationMs: Int
  ) async throws -> URL {
    guard let musicUri = musicUri, !musicUri.isEmpty,
          let musicURL = URL(string: musicUri) else {
      return videoURL
    }
    let audioAsset = AVURLAsset(url: musicURL)
    let audioTracks = try await audioAsset.loadTracks(withMediaType: .audio)
    guard let audioTrack = audioTracks.first else {
      return videoURL
    }

    let videoAsset = AVURLAsset(url: videoURL)
    let videoTracks = try await videoAsset.loadTracks(withMediaType: .video)
    guard let videoTrack = videoTracks.first else {
      return videoURL
    }
    let videoDuration = try await videoAsset.load(.duration)

    let composition = AVMutableComposition()
    guard
      let compVideo = composition.addMutableTrack(
        withMediaType: .video,
        preferredTrackID: kCMPersistentTrackID_Invalid
      ),
      let compAudio = composition.addMutableTrack(
        withMediaType: .audio,
        preferredTrackID: kCMPersistentTrackID_Invalid
      )
    else {
      return videoURL
    }

    let videoRange = CMTimeRange(start: .zero, duration: videoDuration)
    try compVideo.insertTimeRange(videoRange, of: videoTrack, at: .zero)
    compVideo.preferredTransform = try await videoTrack.load(.preferredTransform)

    // Loop audio if shorter than video.
    let audioDuration = try await audioAsset.load(.duration)
    if audioDuration.seconds > 0 {
      var inserted = CMTime.zero
      while inserted < videoDuration {
        let remaining = CMTimeSubtract(videoDuration, inserted)
        let take = CMTimeMinimum(remaining, audioDuration)
        let srcRange = CMTimeRange(start: .zero, duration: take)
        try compAudio.insertTimeRange(srcRange, of: audioTrack, at: inserted)
        inserted = CMTimeAdd(inserted, take)
      }
    }

    let finalURL = URL(fileURLWithPath: NSTemporaryDirectory())
      .appendingPathComponent("\(UUID().uuidString).mp4")
    try? FileManager.default.removeItem(at: finalURL)

    guard let export = AVAssetExportSession(
      asset: composition,
      presetName: AVAssetExportPresetHighestQuality
    ) else {
      throw ComposerError.audioMuxFailed("cannot create export session")
    }
    export.outputURL = finalURL
    export.outputFileType = .mp4
    export.shouldOptimizeForNetworkUse = false

    await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
      export.exportAsynchronously {
        cont.resume()
      }
    }

    if export.status != .completed {
      throw ComposerError.audioMuxFailed(
        export.error?.localizedDescription ?? "export status \(export.status.rawValue)"
      )
    }

    try? FileManager.default.removeItem(at: videoURL)
    return finalURL
  }
}
