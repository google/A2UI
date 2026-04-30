#!/bin/bash
set -euo pipefail

# ============================================================================
# scripts/clean.sh
# One-click cleanup of all platform build artifacts (dispatches to ios/android/harmony clean.sh).
#
# Default dry-run: only shows directories and sizes to be deleted, use -y/--yes to actually execute.
#
# Usage:
#   ./scripts/clean.sh                                # dry-run, preview all platforms
#   ./scripts/clean.sh -y                             # actual cleanup for all platforms
#   ./scripts/clean.sh --deep -y                      # deep cleanup for all platforms
#   ./scripts/clean.sh --platform ios -y              # clean iOS only
#   ./scripts/clean.sh --platform ios,android -y      # clean iOS + Android only
#
# Options:
#   -y, --yes              Skip dry-run, execute cleanup directly
#   --deep                 Deep cleanup (passed through to each platform's clean.sh)
#   --platform <list>      Specify platforms to clean, comma-separated (ios,android,harmony)
#                          defaults to all
#   -h, --help             Show help
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=common/_common.sh
source "${SCRIPT_DIR}/common/_common.sh"

DRY_RUN=true
DEEP=false
PLATFORM_LIST="ios,android,harmony"

show_help() {
    sed -n '6,23p' "$0" | sed 's/^# \?//'
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -y|--yes)       DRY_RUN=false; shift ;;
        --deep)         DEEP=true; shift ;;
        --platform)     PLATFORM_LIST="$2"; shift 2 ;;
        -h|--help)      show_help ;;
        *)              error "Unknown argument: $1" ;;
    esac
done

# Convert , to spaces
PLATFORMS=$(echo "$PLATFORM_LIST" | tr ',' ' ')

for p in $PLATFORMS; do
    case "$p" in
        ios|android|harmony) ;;
        *) error "Invalid platform: $p (only ios | android | harmony supported)" ;;
    esac
done

# -------------------- Assemble sub-script arguments --------------------
SUB_ARGS=()
[[ "$DRY_RUN" == false ]] && SUB_ARGS+=(-y)
[[ "$DEEP" == true ]] && SUB_ARGS+=(--deep)

# -------------------- Execute sequentially --------------------
for p in $PLATFORMS; do
    echo
    info "============== Cleaning ${p} =============="
    sub_script="${SCRIPT_DIR}/${p}/clean.sh"
    if [[ ! -x "$sub_script" ]]; then
        warn "Executable sub-script not found: ${sub_script} (skipping)"
        continue
    fi
    # Compatible with bash 3.x: empty arrays under set -u trigger unbound variable with ${arr[@]},
    # use ${arr[@]+"${arr[@]}"} idiom for safe expansion.
    bash "$sub_script" ${SUB_ARGS[@]+"${SUB_ARGS[@]}"} || warn "Issues occurred during ${p} cleanup"
done

echo
if [[ "$DRY_RUN" == true ]]; then
    warn "Above is preview only, nothing deleted. Add -y to execute actual cleanup."
else
    success "All platform cleanup completed"
fi
