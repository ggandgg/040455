Pod::Spec.new do |s|
  s.name           = 'MovieMaker'
  s.version        = '0.1.0'
  s.summary        = 'On-device photo + video compositor backed by AVFoundation.'
  s.description    = 'Local Expo module that composes photos and videos into MP4 with Ken Burns, fades, and Reels-friendly aspect ratios.'
  s.author         = 'photo-app'
  s.homepage       = 'https://github.com/ggandgg/040455'
  s.platforms      = { :ios => '17.0' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '**/*.{h,m,swift}'
end
