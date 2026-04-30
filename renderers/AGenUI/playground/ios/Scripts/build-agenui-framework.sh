#!/bin/bash
set -euo pipefail

# ============================================================================
# build-agenui-framework.sh
# Build AGenUI static library binary into a single Fat Framework
# (supports iphoneos + iphonesimulator)
#
# Usage:
#   ./Scripts/build-agenui-framework.sh [options]
#
# Options:
#   -c, --config <config>       Build configuration (Debug|Release), default Release
#   -o, --output <dir>          Output directory, default ./build-framework
#   -s, --scheme <scheme>       Xcode scheme name, default AGenUI
#   -w, --workspace <ws>        Xcode workspace path
#   -p, --project <proj>        Xcode project path (mutually exclusive with workspace)
#   --skip-clean                Skip final cleanup of temporary build directories
#   -h, --help                  Show help information
#
# Output type: Static library (MACH_O_TYPE=staticlib)
# Output format: AGenUI.framework (Fat Binary: arm64 iphoneos + x86_64 iphonesimulator)
#
# Note:
#   This script outputs a single .framework, suitable for integration scenarios that only support vendored_frameworks = '*.framework'
#   For scenarios supporting xcframework, use build-agenui-xcframework.sh instead
#
#   Important limitation: Fat Framework static libraries cannot contain both device arm64 and simulator arm64,
#   so simulator only supports x86_64 (Apple Silicon Mac runs via Rosetta).
#   For simulator arm64 support, use the xcframework approach.
#
# Examples:
#   ./Scripts/build-agenui-framework.sh \
#       -w Playground/Playground.xcworkspace \
#       -s AGenUI
# ============================================================================

# -------------------- Color output --------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}[INFO]${NC} $*" >&2; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*" >&2; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $*" >&2; }

# -------------------- Default parameters --------------------
CONFIG="Release"
OUTPUT_DIR=""
SCHEME="AGenUI"
WORKSPACE=""
PROJECT=""
SKIP_CLEAN=false
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# -------------------- Argument parsing --------------------
show_help() {
    sed -n '2,32p' "$0" | sed 's/^# \?//'
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -c|--config)
            CONFIG="$2"; shift 2 ;;
        -o|--output)
            OUTPUT_DIR="$2"; shift 2 ;;
        -s|--scheme)
            SCHEME="$2"; shift 2 ;;
        -w|--workspace)
            WORKSPACE="$2"; shift 2 ;;
        -p|--project)
            PROJECT="$2"; shift 2 ;;
        --skip-clean)
            SKIP_CLEAN=true; shift ;;
        -h|--help)
            show_help ;;
        *)
            error "Unknown argument: $1" ;;
    esac
done

# -------------------- Validation --------------------
if [[ -z "$WORKSPACE" && -z "$PROJECT" ]]; then
    AUTO_WORKSPACE="${PROJECT_ROOT}/Playground/Playground.xcworkspace"
    AUTO_PROJECT="${PROJECT_ROOT}/AGenUI.xcodeproj"

    if [[ -d "$AUTO_WORKSPACE" ]]; then
        WORKSPACE="$AUTO_WORKSPACE"
        info "Auto-detected workspace: ${WORKSPACE}"
    elif [[ -d "$AUTO_PROJECT" ]]; then
        PROJECT="$AUTO_PROJECT"
        info "Auto-detected project: ${PROJECT}"
    else
        error "Xcode workspace or project not found, please specify via -w or -p"
    fi
fi

if [[ -n "$WORKSPACE" && ! -d "$WORKSPACE" ]]; then
    error "Workspace does not exist: ${WORKSPACE}"
fi
if [[ -n "$PROJECT" && ! -d "$PROJECT" ]]; then
    error "Project does not exist: ${PROJECT}"
fi

# -------------------- Build parameters --------------------
if [[ -z "$OUTPUT_DIR" ]]; then
    OUTPUT_DIR="${PROJECT_ROOT}/build-framework"
fi

BUILD_DIR="${OUTPUT_DIR}/tmp"
FRAMEWORK_OUTPUT="${OUTPUT_DIR}/${SCHEME}.framework"

# Build xcodebuild base arguments
XCODEBUILD_ARGS=()
if [[ -n "$WORKSPACE" ]]; then
    XCODEBUILD_ARGS+=(-workspace "$WORKSPACE")
else
    XCODEBUILD_ARGS+=(-project "$PROJECT")
fi
XCODEBUILD_ARGS+=(
    -scheme "$SCHEME"
    -configuration "$CONFIG"
)

# Common xcodebuild arguments (static library)
COMMON_XCODEBUILD_ARGS=(
    ONLY_ACTIVE_ARCH=NO
    MACH_O_TYPE=staticlib
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES
    SKIP_INSTALL=YES
    DEBUG_INFORMATION_FORMAT=dwarf
    COPY_PHASE_STRIP=NO
    GCC_GENERATE_DEBUGGING_SYMBOLS=YES
    STRIP_INSTALLED_PRODUCT=NO
    LLVM_LTO=NO
    GCC_OPTIMIZATION_LEVEL=z
    SWIFT_OPTIMIZATION_LEVEL=-Osize
    DEAD_CODE_STRIPPING=YES
    GCC_SYMBOLS_PRIVATE_EXTERN=YES
)

# -------------------- Helper function: wrap .a into .framework --------------------
create_framework_from_archive() {
    local sdk_name="$1"
    local symroot="$2"
    local config_sdk_dir
    case "$sdk_name" in
        iphoneos)        config_sdk_dir="Release-iphoneos" ;;
        iphonesimulator)  config_sdk_dir="Release-iphonesimulator" ;;
        *)                error "Unknown SDK: $sdk_name" ;;
    esac

    local products_dir="${symroot}/sym/${config_sdk_dir}/${SCHEME}"
    local framework_dir="${symroot}/sym/${config_sdk_dir}/${SCHEME}.framework"
    local archive_file="${products_dir}/lib${SCHEME}.a"

    if [[ -d "${framework_dir}" ]]; then
        echo "${framework_dir}"
        return 0
    fi

    if [[ ! -f "${archive_file}" ]]; then
        return 1
    fi

    info "Output is a raw .a file (${archive_file}), re-wrapping as .framework..."

    mkdir -p "${framework_dir}/Headers"
    mkdir -p "${framework_dir}/Modules"

    cp "${archive_file}" "${framework_dir}/${SCHEME}"

    if [[ -d "${products_dir}/Headers" ]]; then
        cp -R "${products_dir}/Headers/"* "${framework_dir}/Headers/" 2>/dev/null || true
    fi
    local umbrella_header=$(find "${symroot}" -name "${SCHEME}-umbrella.h" -not -path "*/obj/*" -type f | head -1)
    if [[ -n "$umbrella_header" ]]; then
        cp "$umbrella_header" "${framework_dir}/Headers/" 2>/dev/null || true
    fi

    # Copy swiftmodule (excluding .private.swiftinterface to avoid exposing internal dependencies)
    if [[ -d "${products_dir}/${SCHEME}.swiftmodule" ]]; then
        mkdir -p "${framework_dir}/Modules/${SCHEME}.swiftmodule"
        for f in "${products_dir}/${SCHEME}.swiftmodule/"*; do
            [[ "$(basename "$f")" == *".private.swiftinterface" ]] && continue
            cp -R "$f" "${framework_dir}/Modules/${SCHEME}.swiftmodule/" 2>/dev/null || true
        done
    fi
    local modulemap=$(find "${symroot}" -name "${SCHEME}.modulemap" -not -path "*/obj/*" -type f | head -1)
    if [[ -n "$modulemap" ]]; then
        cp "$modulemap" "${framework_dir}/Modules/module.modulemap" 2>/dev/null || true
    fi
    if [[ -d "${products_dir}/${SCHEME}.swiftmodule" ]]; then
        mkdir -p "${framework_dir}/${SCHEME}.swiftmodule"
        for f in "${products_dir}/${SCHEME}.swiftmodule/"*; do
            [[ "$(basename "$f")" == *".private.swiftinterface" ]] && continue
            cp -R "$f" "${framework_dir}/${SCHEME}.swiftmodule/" 2>/dev/null || true
        done
    fi

    cat > "${framework_dir}/Info.plist" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>org.cocoapods.AGenUI</string>
    <key>CFBundleName</key>
    <string>AGenUI</string>
    <key>CFBundlePackageType</key>
    <string>FMWK</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
</dict>
</plist>
PLIST

    echo "${framework_dir}"
    return 0
}

# -------------------- Clean old build artifacts --------------------
info "Cleaning old build artifacts..."
rm -rf "${BUILD_DIR}"
rm -rf "${FRAMEWORK_OUTPUT}"
mkdir -p "${BUILD_DIR}"

# -------------------- Build iphoneos (arm64) static library --------------------
info "=========================================="
info "Building iphoneos (arm64) static library..."
info "=========================================="

IPHONEOS_SYMROOT="${BUILD_DIR}/iphoneos"
xcodebuild build \
    "${XCODEBUILD_ARGS[@]}" \
    -sdk iphoneos \
    ARCHS=arm64 \
    "${COMMON_XCODEBUILD_ARGS[@]}" \
    OBJROOT="${IPHONEOS_SYMROOT}/obj" \
    SYMROOT="${IPHONEOS_SYMROOT}/sym" \
    -derivedDataPath "${IPHONEOS_SYMROOT}/DerivedData" \
    | tail -20

IPHONEOS_FRAMEWORK_PATH=$(find "${IPHONEOS_SYMROOT}" -name "${SCHEME}.framework" -type d | head -1)
if [[ -z "$IPHONEOS_FRAMEWORK_PATH" || ! -d "$IPHONEOS_FRAMEWORK_PATH" ]]; then
    IPHONEOS_FRAMEWORK_PATH=$(create_framework_from_archive "iphoneos" "${IPHONEOS_SYMROOT}")
    if [[ -z "$IPHONEOS_FRAMEWORK_PATH" || ! -d "$IPHONEOS_FRAMEWORK_PATH" ]]; then
        error "iphoneos build artifact not found: ${SCHEME}.framework or lib${SCHEME}.a"
    fi
fi
info "iphoneos framework path: ${IPHONEOS_FRAMEWORK_PATH}"
info "iphoneos static library architectures:"
lipo -info "${IPHONEOS_FRAMEWORK_PATH}/${SCHEME}" || true

# -------------------- Build iphonesimulator (x86_64 + arm64) static library --------------------
info "=========================================="
info "Building iphonesimulator (x86_64 + arm64) static library..."
info "=========================================="

IPHONESIM_SYMROOT="${BUILD_DIR}/iphonesimulator"
xcodebuild build \
    "${XCODEBUILD_ARGS[@]}" \
    -sdk iphonesimulator \
    ARCHS="x86_64 arm64" \
    "${COMMON_XCODEBUILD_ARGS[@]}" \
    OBJROOT="${IPHONESIM_SYMROOT}/obj" \
    SYMROOT="${IPHONESIM_SYMROOT}/sym" \
    -derivedDataPath "${IPHONESIM_SYMROOT}/DerivedData" \
    | tail -20

IPHONESIM_FRAMEWORK_PATH=$(find "${IPHONESIM_SYMROOT}" -name "${SCHEME}.framework" -type d | head -1)
if [[ -z "$IPHONESIM_FRAMEWORK_PATH" || ! -d "$IPHONESIM_FRAMEWORK_PATH" ]]; then
    IPHONESIM_FRAMEWORK_PATH=$(create_framework_from_archive "iphonesimulator" "${IPHONESIM_SYMROOT}")
    if [[ -z "$IPHONESIM_FRAMEWORK_PATH" || ! -d "$IPHONESIM_FRAMEWORK_PATH" ]]; then
        error "iphonesimulator build artifact not found: ${SCHEME}.framework or lib${SCHEME}.a"
    fi
fi
info "iphonesimulator framework path: ${IPHONESIM_FRAMEWORK_PATH}"
info "iphonesimulator static library architectures:"
lipo -info "${IPHONESIM_FRAMEWORK_PATH}/${SCHEME}" || true

# -------------------- Create Fat Framework --------------------
info "=========================================="
info "Creating Fat Framework (iphoneos + iphonesimulator)..."
info "=========================================="

# Use simulator framework as base (its Headers and modulemap are more complete)
# Then progressively replace and merge
cp -R "${IPHONESIM_FRAMEWORK_PATH}" "${FRAMEWORK_OUTPUT}"

# 1. Merge binaries: iphoneos arm64 + simulator x86_64
#
#    Important limitation: Fat Framework static libraries cannot contain both device arm64 and simulator arm64!
#    Reason: lipo cannot merge two arm64 slices (architecture name conflict),
#    and libtool -static would mix device arm64 and simulator arm64 .o files
#    into the same arm64 slice, causing linker errors on device:
#      ld: building for 'iOS', but linking in object file built for 'iOS-simulator'
#
#    Therefore Fat Framework can only contain device arm64 + simulator x86_64.
#    Simulator on Apple Silicon Mac will run x86_64 via Rosetta.
#    For full architecture support (including simulator arm64), use the xcframework approach.
info "Merging binary files..."
# Device build artifact (ARCHS=arm64) is already single-architecture, no need for lipo -thin
# Simulator build artifact (ARCHS="x86_64 arm64") is a fat binary, need lipo -thin to extract x86_64

# Extract x86_64 slice from simulator static library
SIM_X86_64_A="${BUILD_DIR}/sim_x86_64.a"
lipo -thin x86_64 "${IPHONESIM_FRAMEWORK_PATH}/${SCHEME}" -output "${SIM_X86_64_A}"

# Create fat binary using lipo (device arm64 + simulator x86_64)
# lipo creates independent slices for each architecture, won't mix device/simulator .o files
# device arm64 uses original file directly (already single-arch), simulator x86_64 extracted from fat binary
lipo -create "${IPHONEOS_FRAMEWORK_PATH}/${SCHEME}" "${SIM_X86_64_A}" -output "${FRAMEWORK_OUTPUT}/${SCHEME}"

info "Fat binary architectures: $(lipo -info "${FRAMEWORK_OUTPUT}/${SCHEME}")"

# 2. Merge swiftmodule: merge device swiftmodule files into the framework
#    device: arm64-apple-ios.swiftinterface
#    simulator: x86_64-apple-ios-simulator.swiftinterface
#
#    Note: Since Fat Framework does not contain simulator arm64,
#    arm64-apple-ios-simulator.swiftinterface must be excluded,
#    otherwise the Swift compiler will try to use it to compile simulator arm64 code,
#    but there is no corresponding arm64 simulator slice in the binary, causing link failure.
#
#    Note: There may be two swiftmodule locations in the framework
#    - <Framework>/<Name>.swiftmodule/  (root directory, standard location)
#    - <Framework>/Modules/<Name>.swiftmodule/  (Modules directory, may be used by CocoaPods)
#    Both locations must contain complete swiftmodule files
#    Otherwise the Swift compiler will report an error:
#    Could not find module 'AGenUI' for target 'arm64-apple-ios';
#    found: arm64-apple-ios-simulator, x86_64-apple-ios-simulator
#
#    Important: .private.swiftinterface files must be excluded!
#    This file contains imports of internal dependencies (e.g. FlexLayout) that external consumers don't have
#    Including it causes compilation error: Unable to resolve module dependency: 'FlexLayout'
#    Binary framework distribution only needs .swiftinterface / .swiftdoc / .abi.json / .swiftmodule
info "Merging swiftmodule..."

# Define the two swiftmodule locations to sync
SWIFTMODULE_DIRS=()
SWIFTMODULE_DIRS+=("${FRAMEWORK_OUTPUT}/${SCHEME}.swiftmodule")
if [[ -d "${FRAMEWORK_OUTPUT}/Modules/${SCHEME}.swiftmodule" ]]; then
    SWIFTMODULE_DIRS+=("${FRAMEWORK_OUTPUT}/Modules/${SCHEME}.swiftmodule")
fi

# Copy device swiftmodule files to all locations (excluding .private.swiftinterface)
DEVICE_SWIFTMODULE="${IPHONEOS_FRAMEWORK_PATH}/${SCHEME}.swiftmodule"
if [[ -d "$DEVICE_SWIFTMODULE" ]]; then
    for sm_dir in "${SWIFTMODULE_DIRS[@]}"; do
        mkdir -p "${sm_dir}"
        # Copy public swiftinterface (excluding private.swiftinterface)
        for f in "${DEVICE_SWIFTMODULE}/"*.swiftinterface; do
            [[ "$f" == *".private.swiftinterface" ]] && continue
            cp "$f" "${sm_dir}/" 2>/dev/null || true
        done
        cp -R "${DEVICE_SWIFTMODULE}/"*.swiftdoc "${sm_dir}/" 2>/dev/null || true
        cp -R "${DEVICE_SWIFTMODULE}/"*.abi.json "${sm_dir}/" 2>/dev/null || true
    done
    info "Merged device swiftmodule (arm64-apple-ios)"
else
    warn "Device swiftmodule not found"
fi

# Remove .private.swiftinterface and arm64-simulator files from all swiftmodule locations
# Prevent leftover private.swiftinterface from simulator build artifacts
# Also exclude arm64-apple-ios-simulator.* files (fat binary doesn't contain simulator arm64)
for sm_dir in "${SWIFTMODULE_DIRS[@]}"; do
    rm -f "${sm_dir}/"*.private.swiftinterface 2>/dev/null || true
    rm -f "${sm_dir}/arm64-apple-ios-simulator."* 2>/dev/null || true
done

# Simulator swiftmodule has been copied via cp -R, confirm both locations have it
SIM_SWIFTMODULE_COUNT=0
for sm_dir in "${SWIFTMODULE_DIRS[@]}"; do
    if [[ -d "${sm_dir}" ]] && ls "${sm_dir}/"*simulator* &>/dev/null; then
        SIM_SWIFTMODULE_COUNT=$((SIM_SWIFTMODULE_COUNT + 1))
    fi
done
if [[ $SIM_SWIFTMODULE_COUNT -gt 0 ]]; then
    info "Included simulator swiftmodule (x86_64-apple-ios-simulator)"
fi

info "swiftmodule locations: ${SWIFTMODULE_DIRS[@]}"
for sm_dir in "${SWIFTMODULE_DIRS[@]}"; do
    info "  ${sm_dir}: $(ls "${sm_dir}/"*.swiftinterface 2>/dev/null | xargs -n1 basename | tr '\n' ' ')"
done

# 3. Copy AGenUI-Swift.h to Headers directory
#    The Swift compiler generates a Swift Compatibility Header, allowing ObjC to call Swift @objc classes
#    But this file is generated in the build temp directory by default and must be manually copied to framework Headers
#
#    Merge strategy: prefer the simulator's Swift.h
#    Simulator Swift.h already contains both arm64-sim + x86_64 architecture sections
#    Device and simulator arm64 sections use the same conditional macro #elif defined(__arm64__) && __arm64__
#    And API declarations are identical (same Swift code, only target triple differs)
#    Therefore arm64 device compilation will correctly match the arm64 section
#    No awk merging to avoid unterminated conditional directive from #if/#endif mismatch
info "Copying AGenUI-Swift.h..."
SIM_SWIFT_HEADER=$(find "${BUILD_DIR}/iphonesimulator" -name "${SCHEME}-Swift.h" -path "*/Swift Compatibility Header/*" 2>/dev/null | head -1)
DEVICE_SWIFT_HEADER=$(find "${BUILD_DIR}/iphoneos" -name "${SCHEME}-Swift.h" -path "*/Swift Compatibility Header/*" 2>/dev/null | head -1)

if [[ -n "$SIM_SWIFT_HEADER" ]]; then
    cp "$SIM_SWIFT_HEADER" "${FRAMEWORK_OUTPUT}/Headers/${SCHEME}-Swift.h"
    info "Copied simulator AGenUI-Swift.h (contains arm64 + x86_64 architecture sections)"
elif [[ -n "$DEVICE_SWIFT_HEADER" ]]; then
    cp "$DEVICE_SWIFT_HEADER" "${FRAMEWORK_OUTPUT}/Headers/${SCHEME}-Swift.h"
    warn "Using device AGenUI-Swift.h (arm64 only, simulator ObjC-to-Swift calls may be incomplete)"
else
    warn "AGenUI-Swift.h not found, ObjC calls to Swift classes will fail"
fi

# 5. Supplement public headers (ensure completeness)
info "Supplementing public headers..."
PUBLIC_HEADERS_DIRS=(
    "${PROJECT_ROOT}/../../platforms/ios/AGenUI/Classes"
)
for hdr_dir in "${PUBLIC_HEADERS_DIRS[@]}"; do
    while IFS= read -r header_file; do
        header_name=$(basename "$header_file")
        if [[ ! -f "${FRAMEWORK_OUTPUT}/Headers/${header_name}" ]]; then
            cp "$header_file" "${FRAMEWORK_OUTPUT}/Headers/"
            info "Copied missing header: ${header_name}"
        fi
    done < <(find "${hdr_dir}" -name "*.h" -type f -not -path "*/ThirdParty/*")
done

# 6. Supplement Yoga C headers
#
#    Copy yoga C headers directly to Headers/ directory (flat, not subdirectory),
#    at the same level as YogaKit ObjC headers.
#    Also fix include paths inside headers (change #include <yoga/XXX.h>
#    to #include "XXX.h" so they can be correctly resolved within the framework)
info "Supplementing Yoga C headers..."
YOGA_HEADERS_DIR="${PROJECT_ROOT}/../../platforms/ios/AGenUI/ThirdParty/FlexLayout/yoga/include/a2ui_yoga"
if [[ -d "$YOGA_HEADERS_DIR" ]]; then
    for yoga_header_path in "${YOGA_HEADERS_DIR}"/*.h; do
        if [[ -f "$yoga_header_path" ]]; then
            yoga_header=$(basename "$yoga_header_path")
            cp "$yoga_header_path" "${FRAMEWORK_OUTPUT}/Headers/"
            # Fix include paths: #include <yoga/XXX.h> -> #include "XXX.h"
            sed -i '' 's/#include <yoga\/\([^>]*\)>/#include "\1"/g' "${FRAMEWORK_OUTPUT}/Headers/${yoga_header}"
            info "Copied Yoga C header: ${yoga_header}"
        fi
    done
else
    warn "Yoga headers directory not found: ${YOGA_HEADERS_DIR}"
fi

# 6b. Supplement YogaKit ObjC headers (UIView+Yoga.h, YGLayout.h, YGLayout+Private.h)
#
#    These are Yoga's ObjC wrapper headers, provided by CocoaPods via FlexLayout/YogaKit.
#    The find in create_framework_from_archive may not be able to extract them from build artifacts,
#    so they need to be explicitly copied from the source directory to Headers/
info "Supplementing YogaKit ObjC headers..."
YOGAKIT_HEADERS_DIR="${PROJECT_ROOT}/../../platforms/ios/AGenUI/ThirdParty/FlexLayout/YogaKit/include/YogaKit"
YOGAKIT_HEADERS=("UIView+Yoga.h" "YGLayout.h" "YGLayout+Private.h")
for yogakit_header in "${YOGAKIT_HEADERS[@]}"; do
    if [[ -f "${YOGAKIT_HEADERS_DIR}/${yogakit_header}" ]]; then
        cp "${YOGAKIT_HEADERS_DIR}/${yogakit_header}" "${FRAMEWORK_OUTPUT}/Headers/"
        info "Copied YogaKit header: ${yogakit_header}"
    else
        warn "YogaKit header not found: ${yogakit_header}"
    fi
done

# 7. Fix umbrella header
#
#    Fix contents:
#    a) Only remove FlexLayout.h reference (not included in framework)
#    b) Keep #import for Yoga C headers and YogaKit ObjC headers (they are all in Headers/)
#    c) Keep relative path import format (#import "XXX.h"), no framework-style conversion
#
#    Differences from previous implementation:
#    - Yoga C headers are flat in Headers/ instead of Headers/yoga/ subdirectory
#    - umbrella header retains all Yoga/YogaKit header references
#    - Uses relative path #import instead of <AGenUI/XXX.h> framework style
# Ensure umbrella header exists (find in create_framework_from_archive may have missed it)
UMBRELLA_HEADER="${FRAMEWORK_OUTPUT}/Headers/AGenUI-umbrella.h"
if [[ ! -f "$UMBRELLA_HEADER" ]]; then
    PODS_UMBRELLA="${PROJECT_ROOT}/Playground/Pods/Target Support Files/${SCHEME}/${SCHEME}-umbrella.h"
    if [[ -f "$PODS_UMBRELLA" ]]; then
        cp "$PODS_UMBRELLA" "$UMBRELLA_HEADER"
        info "Copied umbrella header from Pods"
    fi
fi

info "Fixing umbrella header..."
if [[ -f "$UMBRELLA_HEADER" ]]; then
    # Only remove FlexLayout.h reference (not included in framework)
    sed -i '' '/#import "FlexLayout.h"/d' "$UMBRELLA_HEADER"

    info "Fixed umbrella header (removed FlexLayout reference)"
fi

# 8. Fix module.modulemap
#
#    Only fix basic issues:
#    - Change Swift header absolute path to relative path
#    - Change top-level module declaration to framework module
#    Don't add AGenUI.Yoga submodule (Yoga C headers are exposed via umbrella header)
info "Fixing module.modulemap..."
MODULEMAP_FILE="${FRAMEWORK_OUTPUT}/Modules/module.modulemap"
if [[ -f "$MODULEMAP_FILE" ]]; then
    # Fix Swift header absolute path to relative path
    sed -i '' \
        's|header ".*AGenUI-Swift\.h"|header "AGenUI-Swift.h"|g' \
        "$MODULEMAP_FILE"

    # Fix top-level module declaration to framework module (submodules keep module unchanged)
    sed -i '' \
        's|^module AGenUI {|framework module AGenUI {|' \
        "$MODULEMAP_FILE"

    # Remove potentially leftover AGenUI.Yoga submodule (if any)
    if grep -q 'module AGenUI.Yoga' "$MODULEMAP_FILE"; then
        sed -i '' '/module AGenUI.Yoga {/,/}/d' "$MODULEMAP_FILE"
        info "Removed leftover AGenUI.Yoga submodule"
    fi

    info "Fixed module.modulemap"
fi

# -------------------- Strip debug symbols --------------------
info "Stripping debug symbols..."
binary="${FRAMEWORK_OUTPUT}/${SCHEME}"
if [[ -f "$binary" ]]; then
    size_before=$(stat -f%z "$binary")
    strip -r -S -x "$binary"
    size_after=$(stat -f%z "$binary")
    info "Binary size: ${size_before} -> ${size_after} (reduced by $(( (size_before - size_after) * 100 / size_before ))%)"
fi

# -------------------- Copy resources --------------------
info "Copying resources..."

BUNDLE_SOURCE="${PROJECT_ROOT}/AGenUI/Assets/AGenUI.bundle"
if [[ -d "$BUNDLE_SOURCE" ]]; then
    cp -R "${BUNDLE_SOURCE}" "${FRAMEWORK_OUTPUT}/"
    info "Copied AGenUI.bundle"
else
    warn "AGenUI.bundle not found, skipping resource copy"
fi

PRIVACY_SOURCE="${PROJECT_ROOT}/AGenUI/Assets/PrivacyInfo.xcprivacy"
if [[ -f "$PRIVACY_SOURCE" ]]; then
    cp "${PRIVACY_SOURCE}" "${FRAMEWORK_OUTPUT}/"
    info "Copied PrivacyInfo.xcprivacy"
elif [[ -f "${BUNDLE_SOURCE}/PrivacyInfo.xcprivacy" ]]; then
    cp "${BUNDLE_SOURCE}/PrivacyInfo.xcprivacy" "${FRAMEWORK_OUTPUT}/"
    info "Copied PrivacyInfo.xcprivacy (from bundle)"
else
    warn "PrivacyInfo.xcprivacy not found, skipping copy"
fi

# -------------------- Package release Zip --------------------
info "Packaging release Zip..."
ZIP_OUTPUT_DIR="${OUTPUT_DIR}/zip"
mkdir -p "${ZIP_OUTPUT_DIR}"
cd "${OUTPUT_DIR}"
zip -r -q "${ZIP_OUTPUT_DIR}/AGenUI.zip" "${SCHEME}.framework"
info "Release Zip: ${ZIP_OUTPUT_DIR}/AGenUI.zip"
info "Zip size: $(du -sh "${ZIP_OUTPUT_DIR}/AGenUI.zip" | cut -f1)"

# -------------------- Output info --------------------
info "=========================================="
info "Build summary"
info "=========================================="
info "Framework: ${FRAMEWORK_OUTPUT}"
info "Release Zip: ${ZIP_OUTPUT_DIR}/AGenUI.zip"

info "Fat binary architectures:"
lipo -info "${FRAMEWORK_OUTPUT}/${SCHEME}"

info "swiftmodule files:"
ls "${FRAMEWORK_OUTPUT}/${SCHEME}.swiftmodule/"

info "Framework size:"
du -sh "${FRAMEWORK_OUTPUT}"

# -------------------- Clean temporary files --------------------
if [[ "$SKIP_CLEAN" == false ]]; then
    info "Cleaning temporary build directories..."
    rm -rf "${BUILD_DIR}"
else
    warn "Skipping temporary build directory cleanup (--skip-clean) (kept: ${BUILD_DIR})"
fi

success "AGenUI static library Fat Framework build completed!"
success "Output path: ${FRAMEWORK_OUTPUT}"
success "Release Zip: ${ZIP_OUTPUT_DIR}/AGenUI.zip"
success "Output type: Static library (MACH_O_TYPE=staticlib)"
success "Supported architectures: arm64 (iphoneos) + x86_64 (iphonesimulator)"
