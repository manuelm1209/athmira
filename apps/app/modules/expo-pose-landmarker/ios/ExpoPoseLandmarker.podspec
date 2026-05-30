Pod::Spec.new do |s|
  s.name           = 'ExpoPoseLandmarker'
  s.version        = '0.1.0'
  s.summary        = 'athmira local Expo Module wrapping MediaPipe Pose Landmarker on iOS (Metal GPU delegate).'
  s.description    = 'Exposes detectPoseFromUri and warmUp to React Native via the Expo Module API.'
  s.author         = 'athmira'
  s.homepage       = 'https://athmira.com'
  # 15.1 = current Expo SDK 55 default. Bump to 16.4 once the SDK 56
  # upgrade lands; MediaPipe requires only iOS 12+.
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'MediaPipeTasksVision', '~> 0.10.14'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '**/*.{h,m,swift}'

  # MediaPipe Pose Landmarker model. The .task file is not committed (binary,
  # ~5 MB) — drop it into ios/Resources/ before `pod install`. See the module
  # README for the download URL.
  s.resources = 'Resources/*.task'
end
