#!/bin/bash
set -euo pipefail

# ============================================================================
# scripts/android/build.sh
# Build the Android AGenUI AAR / publish to local Maven.
#
# Prerequisites: engine/ directory must exist at the repo root (C++ engine source).
# AGENUI_CPP_ROOT in CMakeLists.txt already points to engine/ directly;
# no additional preparation is required.
#
# Usage:
#   ./scripts/android/build.sh [options]
#
# Options:
#   --task <gradleTask>     Gradle task to run, default: assembleRelease
#                           Other common values:
#                             assembleDebug
#                             publishReleasePublicationToLocalMavenRepository
#   --debug                 Equivalent to --task assembleDebug
#   --publish-local         Equivalent to --task publishReleasePublicationToLocalMavenRepository
#   --clean                 Run ./gradlew clean before building
#   -h, --help              Show this help message
#
# Examples:
#   ./scripts/android/build.sh                       # default assembleRelease
#   ./scripts/android/build.sh --debug --clean
#   ./scripts/android/build.sh --publish-local
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=../common/_common.sh
source "${SCRIPT_DIR}/../common/_common.sh"

# -------------------- Defaults --------------------
GRADLE_TASK="assembleRelease"
DO_CLEAN=false

ANDROID_PROJECT_ROOT="${PLATFORMS_DIR}/android"

# -------------------- Argument parsing --------------------
show_help() {
    sed -n '6,25p' "$0" | sed 's/^# \?//'
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --task)            GRADLE_TASK="$2"; shift 2 ;;
        --debug)           GRADLE_TASK="assembleDebug"; shift ;;
        --publish-local)   GRADLE_TASK="publishReleasePublicationToLocalMavenRepository"; shift ;;
        --clean)           DO_CLEAN=true; shift ;;
        -h|--help)         show_help ;;
        *)                 error "Unknown argument: $1" ;;
    esac
done

[[ -d "$ANDROID_PROJECT_ROOT" ]] || error "Android project directory not found: ${ANDROID_PROJECT_ROOT}"
[[ -x "${ANDROID_PROJECT_ROOT}/gradlew" ]] || error "Executable gradlew not found: ${ANDROID_PROJECT_ROOT}/gradlew"

# -------------------- local.properties reminder --------------------
if [[ ! -f "${ANDROID_PROJECT_ROOT}/local.properties" ]]; then
    warn "${ANDROID_PROJECT_ROOT}/local.properties not found. Make sure the Android SDK path is set via ANDROID_HOME / ANDROID_SDK_ROOT."
fi

ensure_engine_dir

# -------------------- Run Gradle --------------------
cd "$ANDROID_PROJECT_ROOT"

if [[ "$DO_CLEAN" == true ]]; then
    info "Running clean..."
    ./gradlew clean | cat
fi

info "Running Gradle task: ${GRADLE_TASK}"
./gradlew "$GRADLE_TASK" | cat

# -------------------- Print output artifact path --------------------
AAR_DIR="${ANDROID_PROJECT_ROOT}/build/outputs/aar"
if [[ -d "$AAR_DIR" ]]; then
    info "Gradle AAR intermediate output directory: ${AAR_DIR}"
    find "$AAR_DIR" -name '*.aar' -maxdepth 1 -type f -exec ls -lh {} \; 2>/dev/null || true
fi

# -------------------- Copy artifacts to unified output directory --------------------
# Unified output layout: AGenUI/dist/<plat>/<config>/...
# All platforms follow the same layout so CI can collect artifacts
# and downstream scripts (e.g. ext repos) can locate them at fixed paths.
case "$GRADLE_TASK" in
    *Debug*|*debug*)   BUILD_CONFIG="debug" ;;
    *)                 BUILD_CONFIG="release" ;;
esac

DIST_DIR="${AGENUI_ROOT}/dist/android/${BUILD_CONFIG}"
mkdir -p "$DIST_DIR"

shopt -s nullglob
copied_count=0
for aar in "$AAR_DIR"/*.aar; do
    cp -f "$aar" "$DIST_DIR/"
    copied_count=$((copied_count + 1))
    info "Published to dist: ${DIST_DIR}/$(basename "$aar")"
done
shopt -u nullglob

if [[ "$copied_count" -eq 0 ]]; then
    warn "No AAR artifact found to copy (GRADLE_TASK=${GRADLE_TASK} may not produce an AAR, e.g. publishToLocalMaven)"
else
    info "Unified artifact directory: ${DIST_DIR}"
fi

success "Android build complete (${GRADLE_TASK})"
