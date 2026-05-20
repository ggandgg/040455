import ExpoModulesCore

struct ResolutionSpec: Record {
  @Field var w: Int = 1080
  @Field var h: Int = 1920
}

struct RhythmSpec: Record {
  @Field var mode: String = "fixed"
  @Field var minClipMs: Int = 600
  @Field var maxClipMs: Int = 1200
}

struct TransitionSpec: Record {
  @Field var type: String = "cut"
  @Field var durationMs: Int = 0
  @Field var weight: Double = 1.0
}

struct EffectSpec: Record {
  @Field var type: String = "none"
  @Field var intensity: Double = 0.0
}

struct TemplateSpec: Record {
  @Field var id: String = ""
  @Field var aspectRatio: String = "9:16"
  @Field var resolution: ResolutionSpec = ResolutionSpec()
  @Field var rhythm: RhythmSpec = RhythmSpec()
  @Field var transitions: [TransitionSpec] = []
  @Field var effects: [EffectSpec] = []
}

struct ComposeAsset: Record {
  @Field var id: String = ""
  @Field var kind: String = "photo"
}

struct ComposeRequest: Record {
  @Field var assets: [ComposeAsset] = []
  @Field var template: TemplateSpec = TemplateSpec()
  @Field var musicUri: String? = nil
  @Field var outputDurationMs: Int = 0
}

struct ComposeResult {
  let uri: String
  let durationMs: Int
  let width: Int
  let height: Int
}
