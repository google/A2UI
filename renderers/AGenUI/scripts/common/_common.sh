#!/bin/bash
# =============================================================================
# scripts/common/_common.sh
# Shared utilities for all platform build scripts: logging + repo path constants.
#
# Monorepo structure (Plan B):
#   All platform build configs directly reference engine/ path, no symlinks needed.
#   This file only provides shared logging functions and path constants for build.sh scripts.
#
# Path constants:
#   AGENUI_ROOT     = agenui repo root directory
#   ENGINE_DIR      = agenui/engine (C++ engine source code)
#   PLATFORMS_DIR   = agenui/platforms (platform projects)
# =============================================================================

if [[ -z "${_AGENUI_COMMON_LOADED:-}" ]]; then
    _AGENUI_COMMON_LOADED=1

    # -------------------- Colors and logging --------------------
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'

    info()    { echo -e "${BLUE}[INFO]${NC} $*" >&2; }
    warn()    { echo -e "${YELLOW}[WARN]${NC} $*" >&2; }
    error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }
    success() { echo -e "${GREEN}[SUCCESS]${NC} $*" >&2; }

    # -------------------- Repo path resolution --------------------
    # This file is at agenui/scripts/common/_common.sh, go up 2 levels for repo root
    _COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    AGENUI_ROOT="$(cd "${_COMMON_DIR}/../.." && pwd)"
    ENGINE_DIR="${AGENUI_ROOT}/engine"
    PLATFORMS_DIR="${AGENUI_ROOT}/platforms"
fi

# Verify C++ engine source integrity
ensure_engine_dir() {
    if [[ ! -d "${ENGINE_DIR}/src" ]] || [[ ! -d "${ENGINE_DIR}/include" ]]; then
        error "C++ engine source directory not found: ${ENGINE_DIR} (missing src/ or include/)"
    fi
}

# -------------------- Cleanup utilities --------------------
# Calculate path size (human-readable); returns - if not exists
human_size() {
    local target="$1"
    if [[ -e "$target" ]]; then
        du -sh "$target" 2>/dev/null | awk '{print $1}'
    else
        echo "-"
    fi
}

# Safe delete: must be an absolute path within AGENUI_ROOT (or explicit HOME subpath),
# prevents accidental deletion outside repo or root-level dirs. Dry-run mode only displays, no actual deletion.
#
# Usage: safe_rm <absolute_path> [<dry_run: true|false>]
safe_rm() {
    local target="$1"
    local dry_run="${2:-false}"

    if [[ -z "$target" ]]; then
        warn "safe_rm: target path is empty, skipping"
        return 0
    fi

    # Absolute path validation
    if [[ "${target:0:1}" != "/" ]]; then
        error "safe_rm: refusing to delete non-absolute path: ${target}"
    fi

    # Path whitelist: must be within AGENUI_ROOT or HOME, and cannot equal either
    local allowed=false
    if [[ "$target" == "${AGENUI_ROOT}/"* ]]; then allowed=true; fi
    if [[ "$target" == "${HOME}/"* ]]; then allowed=true; fi
    if [[ "$allowed" != "true" ]]; then
        error "safe_rm: refusing to delete path outside AGENUI_ROOT/HOME: ${target}"
    fi
    if [[ "$target" == "${AGENUI_ROOT}" ]] || [[ "$target" == "${HOME}" ]]; then
        error "safe_rm: refusing to delete root directory: ${target}"
    fi

    if [[ ! -e "$target" ]]; then
        info "  Skipped (not exists): ${target}"
        return 0
    fi

    local size
    size=$(human_size "$target")

    if [[ "$dry_run" == "true" ]]; then
        info "  [dry-run] Would delete (${size}): ${target}"
    else
        info "  Deleting (${size}): ${target}"
        rm -rf "$target"
    fi
}
