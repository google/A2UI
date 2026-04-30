#!/bin/bash
set -euo pipefail

# ============================================================================
# scripts/harmony/clean.sh
# Cleans the build artifacts of the Harmony project.
#
# Defaults to dry-run: only previews the directories that would be removed
# along with their sizes; pass -y/--yes to actually delete them.
#
# Usage:
#   ./scripts/harmony/clean.sh                # dry-run
#   ./scripts/harmony/clean.sh -y             # perform the cleanup
#   ./scripts/harmony/clean.sh --deep -y      # deep clean (incl. oh_modules / .hvigor)
#
# Options:
#   -y, --yes      Skip dry-run and perform the cleanup
#   --deep         Deep clean: additionally remove oh_modules / .hvigor / .preview
#   -h, --help     Show this help
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=../common/_common.sh
source "${SCRIPT_DIR}/../common/_common.sh"

DRY_RUN=true
DEEP=false

show_help() {
    sed -n '6,17p' "$0" | sed 's/^# \?//'
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

HARMONY_PROJECT_ROOT="${PLATFORMS_DIR}/harmony"
[[ -d "$HARMONY_PROJECT_ROOT" ]] || error "Harmony project directory not found: ${HARMONY_PROJECT_ROOT}"

# -------------------- Default cleanup targets --------------------
# Each module under the Harmony project (agenui / entry / root) may produce
# build/ and output/ directories; we use `find` to collect them all so that
# newly added modules are picked up automatically.
# Also remove the unified output directory used by scripts/harmony/build.sh:
# <repo_root>/dist/harmony/.
TARGETS=()

# Unified HAR output directory (kept in sync with scripts/harmony/build.sh).
HAR_OUTPUT_DIR="${AGENUI_ROOT}/dist/harmony"
# Legacy output directory (pre-unification); cleaned for backward-compat.
LEGACY_HAR_OUTPUT_DIR="${AGENUI_ROOT}/harmony_output"

# Default scope: build/ and .cxx/ from every module, any project-level output/,
# and the repo-root dist/harmony/ (plus the legacy harmony_output/ if present).
collect_default_targets() {
    while IFS= read -r line; do
        [[ -n "$line" ]] && TARGETS+=("$line")
    done < <(find "$HARMONY_PROJECT_ROOT" -maxdepth 3 -type d \
        \( -name 'build' -o -name '.cxx' -o -name 'output' \) \
        ! -path "*/oh_modules/*" ! -path "*/node_modules/*" 2>/dev/null)

    # Repo-root dist/harmony/ (current unified artifact directory).
    if [[ -d "$HAR_OUTPUT_DIR" ]]; then
        TARGETS+=("$HAR_OUTPUT_DIR")
    fi
    # Legacy harmony_output/ (pre-unification leftover; harmless if absent).
    if [[ -d "$LEGACY_HAR_OUTPUT_DIR" ]]; then
        TARGETS+=("$LEGACY_HAR_OUTPUT_DIR")
    fi
}

# Deep scope: additionally cover oh_modules / node_modules / .hvigor / .preview / .idea.
collect_deep_targets() {
    while IFS= read -r line; do
        [[ -n "$line" ]] && TARGETS+=("$line")
    done < <(find "$HARMONY_PROJECT_ROOT" -maxdepth 3 -type d \
        \( -name 'oh_modules' -o -name 'node_modules' -o -name '.hvigor' -o -name '.preview' -o -name '.idea' \) 2>/dev/null)
}

collect_default_targets
[[ "$DEEP" == true ]] && collect_deep_targets

# -------------------- Execution --------------------
if [[ "$DRY_RUN" == true ]]; then
    info "Harmony cleanup preview (dry-run; pass -y to actually delete):"
else
    info "Starting Harmony cleanup:"
fi

if [[ ${#TARGETS[@]} -eq 0 ]]; then
    info "  Nothing to clean"
else
    for target in "${TARGETS[@]}"; do
        safe_rm "$target" "$DRY_RUN"
    done
fi

if [[ "$DRY_RUN" == true ]]; then
    warn "Preview only; nothing was deleted. Re-run with -y to perform the cleanup."
else
    success "Harmony cleanup finished"
fi
