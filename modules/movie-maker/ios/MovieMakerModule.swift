import ExpoModulesCore

public class MovieMakerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MovieMaker")

    Events("onProgress")

    AsyncFunction("compose") { (request: ComposeRequest, promise: Promise) in
      let weakSelf = self
      Task {
        do {
          let composer = MovieComposer { progress in
            weakSelf.sendEvent("onProgress", ["value": progress])
          }
          let result = try await composer.compose(request: request)
          promise.resolve([
            "uri": result.uri,
            "durationMs": result.durationMs,
            "width": result.width,
            "height": result.height
          ])
        } catch {
          promise.reject("MovieMakerError", error.localizedDescription)
        }
      }
    }
  }
}
