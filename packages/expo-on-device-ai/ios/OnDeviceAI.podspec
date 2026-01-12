Pod::Spec.new do |s|
  s.name           = 'OnDeviceAI'
  s.version        = '1.0.0'
  s.summary        = 'On-device AI module for Expo'
  s.description    = 'Expo native module providing on-device AI capabilities using Apple Foundation Models'
  s.homepage       = 'https://github.com/example/expo-on-device-ai'
  s.license        = 'MIT'
  s.author         = 'Expo On-Device AI Contributors'
  s.source         = { git: '' }

  s.platforms      = { ios: '26.0' }
  s.swift_version  = '5.9'
  s.source_files   = '**/*.swift'

  s.dependency 'ExpoModulesCore'
  s.frameworks     = 'FoundationModels'
end
