Pod::Spec.new do |s|
  s.name             = 'AGenUI'
  s.version          = '0.9.8'
  s.summary          = 'A Native Renderer for A2UI.'
  s.description      = 'A Native Renderer for A2UI.'
  s.homepage         = 'https://genui.amap.com'
  s.author           = { 'ACoder AI Infra' => 'tengjixiang.ttjx@autonavi.com' }
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.source           = { :git => 'https://github.com/acoder-ai-infra/AGenUI-A2UI-iOS.git', :tag => s.version.to_s }
  s.swift_version         = '5.0'
  s.ios.deployment_target = '13.0'

  # Force building as a static framework
  s.static_framework = true

  s.source_files = 'AGenUI/Classes/**/*'
  
  # Only expose pure Objective-C headers to Swift, excluding C++ headers
  s.public_header_files = 'AGenUI/Classes/**/*.h'
     
  # C++ dependency config - engine/ directory in monorepo is linked via prepare_command hard-link tree; symlinks are not recognized by the project
  s.prepare_command = <<-CMD.gsub(/^\s{4}/, '')
    set -e
    ENGINE_REL="../../engine"
    if [ ! -d "$ENGINE_REL" ]; then
      echo "[AGenUI.podspec] ERROR: engine directory not found: $(pwd)/$ENGINE_REL" >&2
      exit 1
    fi
    rm -rf engine
    if cp -al "$ENGINE_REL" engine 2>/dev/null; then
      echo "[AGenUI.podspec] Created hard-link tree engine <-> $ENGINE_REL (shared inode)"
    else
      cp -R "$ENGINE_REL" engine
      echo "[AGenUI.podspec] WARN: cp -al failed, fell back to regular copy"
    fi
  CMD
     
  # C++ dependency config - fetched from remote git repository
  s.subspec 'CPP' do |cpp|
    # C++ source files - headers excluded from source_files to avoid entering umbrella header
    cpp.source_files = [
      'engine/src/**/*.{cpp,cc,c}'
    ]
      
    # Preserve header paths only, not as public headers
    cpp.preserve_paths = 'engine/**/*'
      
    # Header search paths - using correct CocoaPods paths
    # Must include src directory and its subdirectories, as C++ code uses relative paths like #include "core/subscriber.h"
    cpp.xcconfig = {
      'HEADER_SEARCH_PATHS' => '"${PODS_TARGET_SRCROOT}/engine/include" "${PODS_TARGET_SRCROOT}/engine/src" "${PODS_TARGET_SRCROOT}/engine/src/**"',
      'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17',
      'CLANG_CXX_LIBRARY' => 'libc++',
      'GCC_PREPROCESSOR_DEFINITIONS' => '$(inherited) COCOAPODS=1',

      # Binary size optimization config
      'GCC_OPTIMIZATION_LEVEL' => 'z',
      'SWIFT_OPTIMIZATION_LEVEL' => '-Osize',
      'SWIFT_COMPILATION_MODE' => 'wholemodule',
      'LLVM_LTO' => 'YES',
      'DEAD_CODE_STRIPPING' => 'YES',
      'STRIP_INSTALLED_PRODUCT' => 'YES',
      'STRIP_STYLE' => 'all',
      'GCC_SYMBOLS_PRIVATE_EXTERN' => 'YES',
      'DEPLOYMENT_POSTPROCESSING' => 'YES',

      # Disable C++ RTTI (Runtime Type Information)
      'GCC_ENABLE_CPP_RTTI' => 'NO'
    }
    
    # Exclude JNI-related files (Android only)
    cpp.exclude_files = [
      'engine/src/third_party/ik/**/*',
      'engine/src/jni/**/*',
      'engine/src/third_party/sax/**/*',
      'engine/src/third_party/yoga/**/*'
    ]
  end

  # Release binary size optimization (applies to Release configuration only)
  s.pod_target_xcconfig = {
    'GCC_OPTIMIZATION_LEVEL[config=Release]' => 'z',
    'SWIFT_OPTIMIZATION_LEVEL[config=Release]' => '-Osize',
    'SWIFT_COMPILATION_MODE[config=Release]' => 'wholemodule',
    'LLVM_LTO[config=Release]' => 'YES',
    'DEAD_CODE_STRIPPING[config=Release]' => 'YES',
    'STRIP_INSTALLED_PRODUCT[config=Release]' => 'YES',
    'STRIP_STYLE[config=Release]' => 'all',
    'GCC_SYMBOLS_PRIVATE_EXTERN[config=Release]' => 'YES',
    'DEPLOYMENT_POSTPROCESSING[config=Release]' => 'YES'
  }
  
  # Include C++ subspec by default
  s.default_subspecs = 'CPP'
  
  # Resource config - include the entire bundle directly
  s.resources = 'AGenUI/Assets/AGenUI.bundle'

  # s.frameworks = 'UIKit', 'Foundation'
  s.dependency 'FlexLayout'
end
