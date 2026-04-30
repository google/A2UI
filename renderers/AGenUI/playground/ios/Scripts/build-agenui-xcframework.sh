#!/bin/bash
set -euo pipefail

# ============================================================================
# build-agenui-xcframework.sh
# Build AGenUI static library binary into XCFramework (supports iphoneos + iphonesimulator)
#
# Usage:
#   ./Scripts/build-agenui-xcframework.sh [options]
#
# Options:
#   -c, --config <config>       Build configuration (Debug|Release), default Release
#   -o, --output <dir>          Output directory, default ./build
#   -s, --scheme <scheme>       Xcode scheme name, default AGenUI
#   -w, --workspace <ws>        Xcode workspace path
#   -p, --project <proj>        Xcode project path (mutually exclusive with workspace)
#   --skip-clean                Skip final cleanup of temporary build directories
#   -h, --help                  Show help information
#
# Output type: Static library (MACH_O_TYPE=staticlib)
#
# Examples:
#   # Build with workspace (CocoaPods integration)
#   ./Scripts/build-agenui-xcframework.sh \
#       -w Playground/Playground.xcworkspace \
#       -s AGenUI
#
#   # Build with project
#   ./Scripts/build-agenui-xcframework.sh \
#       -p AGenUI.xcodeproj \
#       -s AGenUI
#
#   # Specify Debug configuration and custom output directory
#   ./Scripts/build-agenui-xcframework.sh -c Debug -o ./output
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
    sed -n '2,30p' "$0" | sed 's/^# \?//'
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
    # Auto-detect: prefer Playground workspace (CocoaPods development mode)
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
    OUTPUT_DIR="${PROJECT_ROOT}/build"
fi

BUILD_DIR="${OUTPUT_DIR}/tmp"
XCFRAMEWORK_OUTPUT="${OUTPUT_DIR}/${SCHEME}.xcframework"

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
# Note: Using build instead of archive, as archive mode is incompatible with CocoaPods static frameworks
#   which causes BuildProductsPath errors with appintentsmetadataprocessor
# Note: DEBUG_INFORMATION_FORMAT set to dwarf, because in build mode dwarf-with-dsym would
#   embed DWARF debug info directly into the static library binary (instead of generating a separate dSYM), causing ~7x size bloat
#   The final artifact will be stripped of debug symbols after creating the xcframework
COMMON_XCODEBUILD_ARGS=(
    ONLY_ACTIVE_ARCH=NO
    MACH_O_TYPE=staticlib
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES
    SKIP_INSTALL=YES
    DEBUG_INFORMATION_FORMAT=dwarf
    COPY_PHASE_STRIP=NO
    GCC_GENERATE_DEBUGGING_SYMBOLS=YES
    # Skip the Strip phase during build: strip -D on fat binary static library (x86_64+arm64)
    #   fails with "symbols referenced by relocation entries that can't be stripped"
    #   Instead, the script strips debug symbols with strip -r -S -x after creating the xcframework
    STRIP_INSTALLED_PRODUCT=NO
    # Binary size optimization: compile-time optimization options
    # Note: Not using LLVM_LTO=YES, as LTO compiles C++ object files to LLVM bitcode
    #   causing xcodebuild -create-xcframework to error with "Unknown header: 0xb17c0de"
    #   Must be explicitly set to NO to override LLVM_LTO=YES in CocoaPods xcconfig
    LLVM_LTO=NO
    GCC_OPTIMIZATION_LEVEL=z
    SWIFT_OPTIMIZATION_LEVEL=-Osize
    DEAD_CODE_STRIPPING=YES
    GCC_SYMBOLS_PRIVATE_EXTERN=YES
)

# -------------------- Helper function: wrap .a into .framework --------------------
# When MACH_O_TYPE=staticlib, Xcode may strip the static framework binary to a raw .a file
# This function re-wraps it into a proper framework bundle structure
create_framework_from_archive() {
    local sdk_name="$1"  # iphoneos or iphonesimulator
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

    # If framework already exists, return directly
    if [[ -d "${framework_dir}" ]]; then
        echo "${framework_dir}"
        return 0
    fi

    # If .a also does not exist, report error
    if [[ ! -f "${archive_file}" ]]; then
        return 1
    fi

    info "Output is a raw .a file (${archive_file}), re-wrapping as .framework..."

    # Create framework directory structure
    mkdir -p "${framework_dir}/Headers"
    mkdir -p "${framework_dir}/Modules"

    # Copy binary
    cp "${archive_file}" "${framework_dir}/${SCHEME}"

    # Copy headers
    if [[ -d "${products_dir}/Headers" ]]; then
        cp -R "${products_dir}/Headers/"* "${framework_dir}/Headers/" 2>/dev/null || true
    fi
    # Copy from umbrella header path
    local umbrella_header=$(find "${symroot}" -name "${SCHEME}-umbrella.h" -type f | head -1)
    if [[ -n "$umbrella_header" ]]; then
        cp "$umbrella_header" "${framework_dir}/Headers/" 2>/dev/null || true
    fi

    # Copy module definitions (excluding .private.swiftinterface to avoid exposing internal dependencies)
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
    # Copy swiftinterface (BUILD_LIBRARY_FOR_DISTRIBUTION), excluding .private.swiftinterface
    # .private.swiftinterface contains imports of internal dependencies (e.g. FlexLayout) that external consumers don't have
    # Including it causes compilation error: Unable to resolve module dependency: 'FlexLayout'
    if [[ -d "${products_dir}/${SCHEME}.swiftmodule" ]]; then
        mkdir -p "${framework_dir}/${SCHEME}.swiftmodule"
        for f in "${products_dir}/${SCHEME}.swiftmodule/"*; do
            [[ "$(basename "$f")" == *".private.swiftinterface" ]] && continue
            cp -R "$f" "${framework_dir}/${SCHEME}.swiftmodule/" 2>/dev/null || true
        done
    fi

    # Create Info.plist
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
rm -rf "${XCFRAMEWORK_OUTPUT}"
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

# Locate framework in SYMROOT
IPHONEOS_FRAMEWORK_PATH=$(find "${IPHONEOS_SYMROOT}" -name "${SCHEME}.framework" -type d | head -1)
if [[ -z "$IPHONEOS_FRAMEWORK_PATH" || ! -d "$IPHONEOS_FRAMEWORK_PATH" ]]; then
    # In LTO mode the artifact may degrade to a raw .a, try re-wrapping
    IPHONEOS_FRAMEWORK_PATH=$(create_framework_from_archive "iphoneos" "${IPHONEOS_SYMROOT}")
    if [[ -z "$IPHONEOS_FRAMEWORK_PATH" || ! -d "$IPHONEOS_FRAMEWORK_PATH" ]]; then
        error "iphoneos build artifact not found: ${SCHEME}.framework or lib${SCHEME}.a"
    fi
fi
info "iphoneos framework path: ${IPHONEOS_FRAMEWORK_PATH}"

# Display architecture info
info "iphoneos static library architectures:"
lipo -info "${IPHONEOS_FRAMEWORK_PATH}/${SCHEME}" || true
# Confirm it is a static library
file "${IPHONEOS_FRAMEWORK_PATH}/${SCHEME}" | grep -q "archive" && info "iphoneos artifact type: static library ✓" || warn "iphoneos artifact type may not be a static library"

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

# Locate framework in SYMROOT
IPHONESIM_FRAMEWORK_PATH=$(find "${IPHONESIM_SYMROOT}" -name "${SCHEME}.framework" -type d | head -1)
if [[ -z "$IPHONESIM_FRAMEWORK_PATH" || ! -d "$IPHONESIM_FRAMEWORK_PATH" ]]; then
    # In LTO mode the artifact may degrade to a raw .a, try re-wrapping
    IPHONESIM_FRAMEWORK_PATH=$(create_framework_from_archive "iphonesimulator" "${IPHONESIM_SYMROOT}")
    if [[ -z "$IPHONESIM_FRAMEWORK_PATH" || ! -d "$IPHONESIM_FRAMEWORK_PATH" ]]; then
        error "iphonesimulator build artifact not found: ${SCHEME}.framework or lib${SCHEME}.a"
    fi
fi
info "iphonesimulator framework path: ${IPHONESIM_FRAMEWORK_PATH}"

# Display architecture info
info "iphonesimulator static library architectures:"
lipo -info "${IPHONESIM_FRAMEWORK_PATH}/${SCHEME}" || true
# Confirm it is a static library
file "${IPHONESIM_FRAMEWORK_PATH}/${SCHEME}" | grep -q "archive" && info "iphonesimulator artifact type: static library ✓" || warn "iphonesimulator artifact type may not be a static library"

# -------------------- Create XCFramework (static library) --------------------
info "=========================================="
info "Creating static library XCFramework..."
info "=========================================="

xcodebuild -create-xcframework \
    -framework "${IPHONEOS_FRAMEWORK_PATH}" \
    -framework "${IPHONESIM_FRAMEWORK_PATH}" \
    -output "${XCFRAMEWORK_OUTPUT}"

# Verify XCFramework
if [[ ! -d "${XCFRAMEWORK_OUTPUT}" ]]; then
    error "XCFramework creation failed"
fi

# -------------------- Strip debug symbols --------------------
# Static libraries in build mode embed DWARF debug info, causing binary size bloat
# Use strip -r -S -x to remove debug symbols, keeping only necessary external symbol tables
info "Stripping debug symbols..."
for framework in "${XCFRAMEWORK_OUTPUT}"/*/${SCHEME}.framework; do
    binary="${framework}/${SCHEME}"
    if [[ -f "$binary" ]]; then
        size_before=$(stat -f%z "$binary")
        strip -r -S -x "$binary"
        size_after=$(stat -f%z "$binary")
        info "$(basename "$(dirname "$framework")"): ${size_before} -> ${size_after} (reduced by $(( (size_before - size_after) * 100 / size_before ))%)"
    fi
done

# -------------------- Fix Headers ------------------
# xcodebuild -create-xcframework only copies umbrella header to Headers directory
# Need to supplement all public headers and ensure umbrella header exists as AGenUI.h
# So external consumers can reference via #import <AGenUI/AGenUI.h>
info "Fixing Headers directory..."
PUBLIC_HEADERS_DIRS=(
    "${PROJECT_ROOT}/../../platforms/ios/AGenUI/Classes"
)
UMBRELLA_HEADER=""
for framework in "${XCFRAMEWORK_OUTPUT}"/*/${SCHEME}.framework; do
    headers_dir="${framework}/Headers"
    if [[ ! -d "$headers_dir" ]]; then
        continue
    fi

    # 2. Copy all public header files to Headers directory
    #    xcodebuild -create-xcframework may not have completely copied all .h files
    for hdr_dir in "${PUBLIC_HEADERS_DIRS[@]}"; do
        while IFS= read -r header_file; do
            header_name=$(basename "$header_file")
            if [[ ! -f "${headers_dir}/${header_name}" ]]; then
                cp "$header_file" "${headers_dir}/"
                info "Copied missing header: ${header_name}"
            fi
        done < <(find "${hdr_dir}" -name "*.h" -type f -not -path "*/ThirdParty/*")
    done

    # 2b. Supplement Yoga C headers
    #
    #    Copy yoga C headers directly to Headers/ directory (flat, not subdirectory),
    #    at the same level as YogaKit ObjC headers.
    #    Also fix include paths inside headers
    YOGA_HEADERS_DIR="${PROJECT_ROOT}/../../platforms/ios/AGenUI/ThirdParty/FlexLayout/yoga/include/a2ui_yoga"
    if [[ -d "$YOGA_HEADERS_DIR" ]]; then
        for yoga_header_path in "${YOGA_HEADERS_DIR}"/*.h; do
            if [[ -f "$yoga_header_path" ]]; then
                yoga_header=$(basename "$yoga_header_path")
                cp "$yoga_header_path" "${headers_dir}/"
                # Fix include paths: #include <yoga/XXX.h> -> #include "XXX.h"
                sed -i '' 's/#include <yoga\/\([^>]*\)>/#include "\1"/g' "${headers_dir}/${yoga_header}"
                info "Copied Yoga C header: ${yoga_header}"
            fi
        done
    else
        warn "Yoga headers directory not found: ${YOGA_HEADERS_DIR}"
    fi

    # 2b-2. Supplement YogaKit ObjC headers (UIView+Yoga.h, YGLayout.h, YGLayout+Private.h)
    YOGAKIT_HEADERS_DIR="${PROJECT_ROOT}/../../platforms/ios/AGenUI/ThirdParty/FlexLayout/YogaKit/include/YogaKit"
    YOGAKIT_HEADERS=("UIView+Yoga.h" "YGLayout.h" "YGLayout+Private.h")
    for yogakit_header in "${YOGAKIT_HEADERS[@]}"; do
        if [[ -f "${YOGAKIT_HEADERS_DIR}/${yogakit_header}" ]]; then
            cp "${YOGAKIT_HEADERS_DIR}/${yogakit_header}" "${headers_dir}/"
            info "Copied YogaKit header: ${yogakit_header}"
        else
            warn "YogaKit header not found: ${yogakit_header}"
        fi
    done

    # 2c. Fix umbrella header
    #
    #    Only remove FlexLayout.h reference (not included in framework)
    #    Keep #import for Yoga C headers and YogaKit ObjC headers
    #    Keep relative path import format, no framework-style conversion
    local_umbrella_header="${headers_dir}/${SCHEME}-umbrella.h"
    if [[ -f "$local_umbrella_header" ]]; then
        sed -i '' '/#import "FlexLayout.h"/d' "$local_umbrella_header"
        info "Fixed umbrella header (removed FlexLayout reference)"
    fi

    # 3. Copy AGenUI-Swift.h to Headers directory
    #    The Swift compiler generates a Swift Compatibility Header, allowing ObjC to call Swift @objc classes
    #    But this file is generated in the build temp directory by default and must be manually copied to framework Headers
    #    Otherwise @import AGenUI will error: Could not build module 'AGenUI'
    platform_slice=$(basename "$(dirname "$framework")")
    local_swift_header=""
    if [[ "$platform_slice" == ios-arm64 ]]; then
        local_swift_header=$(find "${BUILD_DIR}/iphoneos" -name "${SCHEME}-Swift.h" -path "*/Swift Compatibility Header/*" 2>/dev/null | head -1)
    else
        local_swift_header=$(find "${BUILD_DIR}/iphonesimulator" -name "${SCHEME}-Swift.h" -path "*/Swift Compatibility Header/*" 2>/dev/null | head -1)
    fi
    if [[ -n "$local_swift_header" ]]; then
        cp "$local_swift_header" "${headers_dir}/"
        info "Copied ${SCHEME}-Swift.h to ${headers_dir}"
    else
        warn "${platform_slice}: ${SCHEME}-Swift.h not found, ObjC calls to Swift classes will fail"
    fi

    # 4. Fix module.modulemap
    #    a) The modulemap generated by xcodebuild references absolute paths to build temp directories
    #       These paths don't exist when distributed externally, causing @import AGenUI to fail
    #       Need to change them to relative paths based on framework Headers directory
    #    b) The modulemap generated by CocoaPods uses 'module' instead of 'framework module'
    #       Since AGenUI is distributed as .framework, missing the framework qualifier causes
    #       Clang to fail parsing headers as a framework
    modulemap_file="${framework}/Modules/module.modulemap"
    if [[ -f "$modulemap_file" ]]; then
        # Fix Swift header absolute path to relative path
        sed -i '' \
            's|header ".*AGenUI-Swift\.h"|header "AGenUI-Swift.h"|g' \
            "$modulemap_file"

        # Fix top-level module declaration to framework module
        sed -i '' \
            's|^module AGenUI {|framework module AGenUI {|' \
            "$modulemap_file"

        # Remove potentially leftover AGenUI.Yoga submodule
        if grep -q 'module AGenUI.Yoga' "$modulemap_file"; then
            sed -i '' '/module AGenUI.Yoga {/,/}/d' "$modulemap_file"
            info "Removed leftover AGenUI.Yoga submodule (${platform_slice})"
        fi

        info "Fixed module.modulemap (${platform_slice})"
    fi
done

# -------------------- Copy resources --------------------
info "Copying resources to XCFramework..."

BUNDLE_SOURCE="${PROJECT_ROOT}/AGenUI/Assets/AGenUI.bundle"
if [[ -d "$BUNDLE_SOURCE" ]]; then
    # Copy bundle to each platform slice in the xcframework
    for platform_dir in "${XCFRAMEWORK_OUTPUT}"/*/; do
        framework_dir=$(find "${platform_dir}" -name "*.framework" -type d -maxdepth 1 | head -1)
        if [[ -n "$framework_dir" ]]; then
            cp -R "${BUNDLE_SOURCE}" "${framework_dir}/"
            info "Copied AGenUI.bundle to ${framework_dir}"
        fi
    done
else
    warn "AGenUI.bundle not found, skipping resource copy"
fi

# Copy privacy manifest to framework root (belt-and-suspenders to ensure Apple scanning tools can detect it)
info "Copying privacy manifest..."
PRIVACY_SOURCE="${PROJECT_ROOT}/AGenUI/Assets/AGenUI.bundle/PrivacyInfo.xcprivacy"
if [[ -f "$PRIVACY_SOURCE" ]]; then
    for platform_dir in "${XCFRAMEWORK_OUTPUT}"/*/; do
        framework_dir=$(find "${platform_dir}" -name "*.framework" -type d -maxdepth 1 | head -1)
        if [[ -n "$framework_dir" ]]; then
            cp "${PRIVACY_SOURCE}" "${framework_dir}/"
            info "Copied PrivacyInfo.xcprivacy to ${framework_dir}"
        fi
    done
else
    warn "PrivacyInfo.xcprivacy not found, skipping copy"
fi

# Copy dSYM symbol files (if they exist)
info "Copying dSYM symbol files..."
DSYM_OUTPUT_DIR="${OUTPUT_DIR}/dSYMs"
mkdir -p "${DSYM_OUTPUT_DIR}"

for sdk_symroot in "${BUILD_DIR}/iphoneos" "${BUILD_DIR}/iphonesimulator"; do
    while IFS= read -r dsym_path; do
        cp -R "${dsym_path}" "${DSYM_OUTPUT_DIR}/" 2>/dev/null || true
    done < <(find "${sdk_symroot}" -name "*.dSYM" -type d)
done

# -------------------- Output info --------------------
info "=========================================="
info "Build summary"
info "=========================================="
info "XCFramework: ${XCFRAMEWORK_OUTPUT}"
info "dSYMs: ${DSYM_OUTPUT_DIR}"

# Display XCFramework structure
info "XCFramework directory structure:"
find "${XCFRAMEWORK_OUTPUT}" -maxdepth 3 -type f -o -type d | head -30

# Display architecture of each slice
info "Architecture info for each slice:"
for framework in "${XCFRAMEWORK_OUTPUT}"/*/"${SCHEME}.framework"; do
    if [[ -f "${framework}/${SCHEME}" ]]; then
        info "$(basename "$(dirname "${framework}")"): $(lipo -info "${framework}/${SCHEME}")"
    fi
done

# Display file sizes
info "Artifact size:"
du -sh "${XCFRAMEWORK_OUTPUT}"

# -------------------- Package release Zip --------------------
# Generate AGenUI.zip for CocoaPods distribution
# Note: Must be packaged as xcframework (not single framework)
# Because a single framework cannot contain both device and simulator swiftmodule
# Causing device compilation to fail finding Swift declarations:
#   'Component' is unavailable: cannot find Swift declaration for this class
info "Packaging release Zip..."
ZIP_OUTPUT_DIR="${OUTPUT_DIR}/zip"
mkdir -p "${ZIP_OUTPUT_DIR}"
cd "${XCFRAMEWORK_OUTPUT}/.."
zip -r -q "${ZIP_OUTPUT_DIR}/AGenUI.zip" AGenUI.xcframework
info "Release Zip: ${ZIP_OUTPUT_DIR}/AGenUI.zip"
info "Zip size: $(du -sh "${ZIP_OUTPUT_DIR}/AGenUI.zip" | cut -f1)"

# -------------------- Clean temporary files --------------------
if [[ "$SKIP_CLEAN" == false ]]; then
    info "Cleaning temporary build directories..."
    rm -rf "${BUILD_DIR}"
else
    warn "Skipping temporary build directory cleanup (--skip-clean) (kept: ${BUILD_DIR})"
fi

success "AGenUI static library XCFramework build completed!"
success "Output path: ${XCFRAMEWORK_OUTPUT}"
success "Release Zip: ${ZIP_OUTPUT_DIR}/AGenUI.zip"
success "Output type: Static library (MACH_O_TYPE=staticlib)"
