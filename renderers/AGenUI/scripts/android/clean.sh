#!/bin/bash
set -euo pipefail

# ============================================================================
# scripts/android/clean.sh
# Clean Android project build artifacts (build / .cxx / .gradle, etc.).
#
# Defaults to dry-run: shows directories and sizes that would be deleted.
# Pass -y/--yes to actually delete.
#
# Usage:
#   ./scripts/android/clean.sh                # dry-run
#   ./scripts/android/clean.sh -y             # actually clean
#   ./scripts/android/clean.sh --deep -y      # deep clean (also runs gradlew clean)
#
# Options:
#   -y, --yes      Skip dry-run and execute the clean
#   --deep         Deep clean: run ./gradlew clean first, then delete directories
#   -h, --help     Show this help message
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=../common/_common.sh
source "${SCRIPT_DIR}/../common/_common.sh"

DRY_RUN=true
DEEP=false

show_help() {
    sed -n '6,20p' "$0" | sed 's/^# \?//'
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -y|--yes)   DRY_RUN=false; shift ;;
        --deep)     DEEP=true; shift ;;
        -h|--help)  show_help ;;
        *)          error "Unknown argument: $1" ;;
    esac
done

ANDROID_PROJECT_ROOT="${PLATFORMS_DIR}/android"
[[ -d "$ANDROID_PROJECT_ROOT" ]] || error "Android project directory not found: ${ANDROID_PROJECT_ROOT}"

# -------------------- Default clean targets --------------------
# Includes Gradle intermediate artifacts + unified output directory dist/android/
# (build.sh copies the final AAR to ${AGENUI_ROOT}/dist/android/<config>/)
TARGETS=(
    "${ANDROID_PROJECT_ROOT}/build"
    "${ANDROID_PROJECT_ROOT}/.cxx"
    "${ANDROID_PROJECT_ROOT}/.gradle"
    "${AGENUI_ROOT}/dist/android"
)

# -------------------- Deep clean: gradlew clean --------------------
if [[ "$DEEP" == true && "$DRY_RUN" == false ]]; then
    if [[ -x "${ANDROID_PROJECT_ROOT}/gradlew" ]]; then
        info "Running ./gradlew clean ..."
        (cd "$ANDROID_PROJECT_ROOT" && ./gradlew clean | cat) || \
            warn "./gradlew clean failed, continuing with directory deletion"
    else
        warn "Executable gradlew not found, skipping ./gradlew clean"
    fi
fi

# -------------------- Execute --------------------
if [[ "$DRY_RUN" == true ]]; then
    info "Android clean preview (dry-run; pass -y to actually delete):"
else
    info "Android clean started:"
fi

for target in "${TARGETS[@]}"; do
    safe_rm "$target" "$DRY_RUN"
done

if [[ "$DRY_RUN" == true ]]; then
    warn "Preview only — nothing was deleted. Append -y to perform the actual clean."
else
    success "Android clean complete"
fi
