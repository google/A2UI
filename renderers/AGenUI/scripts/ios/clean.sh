#!/bin/bash
set -euo pipefail

# ============================================================================
# scripts/ios/clean.sh
# Clean iOS project build artifacts (Pods / build / Podfile.lock etc.).
#
# Default dry-run: only shows directories and sizes to be deleted, use -y/--yes to actually execute.
#
# Usage:
#   ./scripts/ios/clean.sh                    # dry-run, list items to clean
#   ./scripts/ios/clean.sh -y                 # actual cleanup (default scope)
#   ./scripts/ios/clean.sh --deep -y          # deep cleanup (including DerivedData)
#
# Options:
#   -y, --yes      Skip dry-run, execute cleanup directly
#   --deep         Deep cleanup: additionally clear ~/Library/Developer/Xcode/DerivedData
#                  Playground-related directories
#   -h, --help     Show help
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=../common/_common.sh
source "${SCRIPT_DIR}/../common/_common.sh"

DRY_RUN=true
DEEP=false

show_help() {
    sed -n '6,21p' "$0" | sed 's/^# \?//'
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

IOS_PROJECT_ROOT="${AGENUI_ROOT}/playground/ios"
[[ -d "$IOS_PROJECT_ROOT" ]] || error "iOS project directory not found: ${IOS_PROJECT_ROOT}"

# -------------------- Default cleanup targets --------------------
# Includes Playground project artifacts + unified output directory dist/ios/
# (build.sh wrapper passes -o to underlying script, final artifacts go to ${AGENUI_ROOT}/dist/ios/<config>/)
TARGETS=(
    "${IOS_PROJECT_ROOT}/Playground/build"
    "${IOS_PROJECT_ROOT}/Playground/Pods"
    "${IOS_PROJECT_ROOT}/Playground/Podfile.lock"
    "${IOS_PROJECT_ROOT}/Playground/Playground.xcworkspace/xcuserdata"
    "${AGENUI_ROOT}/dist/ios"
)

# -------------------- Deep cleanup: DerivedData --------------------
if [[ "$DEEP" == true ]]; then
    DERIVED_DATA_BASE="${HOME}/Library/Developer/Xcode/DerivedData"
    if [[ -d "$DERIVED_DATA_BASE" ]]; then
        # Collect all Playground-* directories (absolute paths)
        while IFS= read -r line; do
            [[ -n "$line" ]] && TARGETS+=("$line")
        done < <(find "$DERIVED_DATA_BASE" -maxdepth 1 -type d -name 'Playground-*' 2>/dev/null)
    fi
fi

# -------------------- Execute --------------------
if [[ "$DRY_RUN" == true ]]; then
    info "iOS cleanup preview (dry-run, use -y to actually delete):"
else
    info "iOS cleanup started:"
fi

for target in "${TARGETS[@]}"; do
    safe_rm "$target" "$DRY_RUN"
done

if [[ "$DRY_RUN" == true ]]; then
    warn "Above is preview only, nothing deleted. Add -y to execute actual cleanup."
else
    success "iOS cleanup completed"
fi
