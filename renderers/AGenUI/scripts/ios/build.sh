#!/bin/bash
set -euo pipefail

# ============================================================================
# scripts/ios/build.sh
# Build iOS AGenUI static artifacts (Framework / XCFramework).
#
# Prerequisites: engine/ exists under repo root (C++ engine source code).
# source_files / HEADER_SEARCH_PATHS in podspec already point to ../../engine,
# no additional workspace preparation steps needed.
#
# Delegates: the original build scripts under platforms/ios/Scripts/ perform the actual xcodebuild process,
# without re-implementing their internal header / modulemap fix logic (single source of truth).
#
# Usage:
#   ./scripts/ios/build.sh [options]
#
# Options:
#   -t, --type <framework|xcframework>   Artifact type, default xcframework
#   -c, --config <Debug|Release>         Build configuration, default Release
#   -o, --output <dir>                   Output directory
#                                        default <repo_root>/dist/ios/<config_lower>/
#   -s, --scheme <scheme>                Xcode scheme, default AGenUI
#   -w, --workspace <ws>                 Xcode workspace path
#                                        (default platforms/ios/Playground/Playground.xcworkspace)
#   -p, --project <proj>                 Xcode project path (mutually exclusive with workspace)
#   --skip-clean                         Pass through to underlying script, keep temporary build directories
#   --pod-install                        Force pod install (even if Pods already exist)
#   --no-pod-install                     Skip pod install (use when CI has pre-installed Pods)
#   -h, --help                           Show help
#
# pod install behavior:
#   Default (auto-detect): auto-execute when Pods/ is missing or Podfile.lock is inconsistent;
#   --pod-install: force execute; --no-pod-install: skip.
#
# Examples:
#   ./scripts/ios/build.sh                              # default xcframework / Release
#   ./scripts/ios/build.sh -t framework                 # single framework artifact
#   ./scripts/ios/build.sh -c Debug                     # Debug build
#   ./scripts/ios/build.sh --pod-install                # force reinstall Pods
#   ./scripts/ios/build.sh --no-pod-install             # CI skip pod install
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=../common/_common.sh
source "${SCRIPT_DIR}/../common/_common.sh"

# -------------------- Default parameters --------------------
BUILD_TYPE="xcframework"
CONFIG="Release"
OUTPUT_DIR=""
SCHEME="AGenUI"
WORKSPACE=""
PROJECT=""
SKIP_CLEAN=false
# pod install mode: auto | force | skip
POD_INSTALL_MODE="auto"

IOS_PROJECT_ROOT="${AGENUI_ROOT}/playground/ios"
IOS_SCRIPTS_DIR="${IOS_PROJECT_ROOT}/Scripts"
PLAYGROUND_DIR="${IOS_PROJECT_ROOT}/Playground"

# -------------------- Argument parsing --------------------
show_help() {
    sed -n '6,38p' "$0" | sed 's/^# \?//'
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -t|--type)         BUILD_TYPE="$2"; shift 2 ;;
        -c|--config)       CONFIG="$2"; shift 2 ;;
        -o|--output)       OUTPUT_DIR="$2"; shift 2 ;;
        -s|--scheme)       SCHEME="$2"; shift 2 ;;
        -w|--workspace)    WORKSPACE="$2"; shift 2 ;;
        -p|--project)      PROJECT="$2"; shift 2 ;;
        --skip-clean)      SKIP_CLEAN=true; shift ;;
        --pod-install)     POD_INSTALL_MODE="force"; shift ;;
        --no-pod-install)  POD_INSTALL_MODE="skip"; shift ;;
        -h|--help)         show_help ;;
        *)                 error "Unknown argument: $1" ;;
    esac
done

case "$BUILD_TYPE" in
    framework)  RUNNER="${IOS_SCRIPTS_DIR}/build-agenui-framework.sh" ;;
    xcframework) RUNNER="${IOS_SCRIPTS_DIR}/build-agenui-xcframework.sh" ;;
    *) error "Invalid --type: ${BUILD_TYPE} (only framework | xcframework supported)" ;;
esac

[[ -f "$RUNNER" ]] || error "Underlying build script not found: ${RUNNER}"
[[ -d "$IOS_PROJECT_ROOT" ]] || error "iOS project directory not found: ${IOS_PROJECT_ROOT}"
ensure_engine_dir

# -------------------- Default workspace auto-detection --------------------
if [[ -z "$WORKSPACE" && -z "$PROJECT" ]]; then
    DEFAULT_WORKSPACE="${PLAYGROUND_DIR}/Playground.xcworkspace"
    if [[ -d "$DEFAULT_WORKSPACE" ]]; then
        WORKSPACE="$DEFAULT_WORKSPACE"
    fi
fi

# -------------------- pod install --------------------
# Determine whether pod install is needed:
# - skip: explicitly skip
# - force: force execute
# - auto: execute when Pods/ is missing or Manifest.lock is inconsistent with Podfile.lock
need_pod_install() {
    [[ ! -d "${PLAYGROUND_DIR}/Pods" ]] && return 0
    if [[ -f "${PLAYGROUND_DIR}/Podfile.lock" ]] && [[ -f "${PLAYGROUND_DIR}/Pods/Manifest.lock" ]]; then
        if ! diff -q "${PLAYGROUND_DIR}/Podfile.lock" "${PLAYGROUND_DIR}/Pods/Manifest.lock" >/dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

run_pod_install() {
    if [[ ! -f "${PLAYGROUND_DIR}/Podfile" ]]; then
        info "Podfile not found, skipping pod install"
        return 0
    fi
    command -v pod >/dev/null 2>&1 || error "pod command not found, please install CocoaPods first (gem install cocoapods)"
    info "Running pod install (${PLAYGROUND_DIR})"
    (cd "$PLAYGROUND_DIR" && pod install | cat)
}

case "$POD_INSTALL_MODE" in
    skip)
        info "Skipping pod install (--no-pod-install)"
        ;;
    force)
        run_pod_install
        ;;
    auto)
        if need_pod_install; then
            info "Detected missing Pods or Podfile.lock inconsistency, auto-running pod install"
            run_pod_install
        else
            info "Pods are up to date, skipping pod install (use --pod-install to force)"
        fi
        ;;
esac

# -------------------- Unified output directory (aligned with Android / Harmony) --------------------
# Unified rule: AGenUI/dist/<plat>/<config>/...
# When -o is not explicitly specified, defaults to repo root dist/ios/<config>/, overwrite mode.
# Symmetric with Android (dist/android/<config>/) and Harmony (dist/harmony/<config>/).
if [[ -z "$OUTPUT_DIR" ]]; then
    # CONFIG is Debug/Release, lowercased for directory name
    CONFIG_LOWER=$(echo "$CONFIG" | tr '[:upper:]' '[:lower:]')
    OUTPUT_DIR="${AGENUI_ROOT}/dist/ios/${CONFIG_LOWER}"
fi
mkdir -p "$OUTPUT_DIR"
info "Unified artifact directory: ${OUTPUT_DIR}"

# -------------------- Assemble and execute underlying script --------------------
RUNNER_ARGS=(-c "$CONFIG" -s "$SCHEME" -o "$OUTPUT_DIR")
[[ -n "$WORKSPACE" ]]  && RUNNER_ARGS+=(-w "$WORKSPACE")
[[ -n "$PROJECT" ]]    && RUNNER_ARGS+=(-p "$PROJECT")
[[ "$SKIP_CLEAN" == true ]] && RUNNER_ARGS+=(--skip-clean)

info "Calling underlying script: ${RUNNER}"
info "Arguments: ${RUNNER_ARGS[*]}"

bash "$RUNNER" "${RUNNER_ARGS[@]}"

success "iOS ${BUILD_TYPE} build completed"
