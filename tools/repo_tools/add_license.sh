#!/bin/bash
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# This script automatically adds Apache 2.0 license headers to source files.
# It is designed to be run from the repository root.
#
# Usage:
#   ./tools/repo_tools/add_license.sh [directory]
#
# If [directory] is omitted, the script starts from the current directory.
#
# Supported file extensions:
#   - .ts, .tsx, .js, .jsx, .java, .css, .scss
#   - .py, .sh, .yaml, .yml
#   - .html
#
# Files already containing "Copyright" are skipped.
# Shebang lines (#!...) are preserved at the top of the file.

set -e

# Error handling: check if run from repo root
if [ ! -f "LICENSE" ] && [ ! -d ".git" ]; then
  echo "Error: This script should be run from the repository root."
  echo "Example: ./tools/repo_tools/add_license.sh ."
  exit 1
fi

get_block_license() {
  cat << 'EOF'
/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
EOF
}

get_hash_license() {
  cat << 'EOF'
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
EOF
}

get_html_license() {
  cat << 'EOF'
<!--
 Copyright 2026 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
-->
EOF
}

process_file() {
  local file="$1"
  
  # Skip if file already has copyright
  if grep -qi "Copyright" "$file"; then
    return
  fi

  local ext="${file##*.}"
  local header=""

  case "$ext" in
    ts|tsx|js|jsx|java|css|scss)
      header=$(get_block_license)
      ;;
    py|sh|yaml|yml)
      header=$(get_hash_license)
      ;;
    html)
      header=$(get_html_license)
      ;;
    *)
      return
      ;;
  esac

  # Check for shebang
  local first_line=$(head -n 1 "$file")
  if [[ "$first_line" == "#!"* ]]; then
    # File has shebang
    tail -n +2 "$file" > "$file.tmp"
    echo "$first_line" > "$file"
    echo "$header" >> "$file"
    echo "" >> "$file"
    cat "$file.tmp" >> "$file"
    rm "$file.tmp"
  else
    # No shebang
    cat "$file" > "$file.tmp"
    echo "$header" > "$file"
    echo "" >> "$file"
    cat "$file.tmp" >> "$file"
    rm "$file.tmp"
  fi

  echo "Added license to: $file"
}

# Start directory
SEARCH_DIR="${1:-.}"

# Use find to locate files while ignoring common exclusion directories
find "$SEARCH_DIR" -type f \
  -not -path "*/.git/*" \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  -not -path "*/.venv/*" \
  -not -path "*/__pycache__/*" \
  -not -path "*/.wireit/*" \
  -not -path "*/.gemini/*" \
  -not -path "*/.angular/*" \
  -not -name "*.min.js" \
  -not -name "*.min.css" \
  \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.java" -o -name "*.css" -o -name "*.scss" -o -name "*.py" -o -name "*.sh" -o -name "*.yaml" -o -name "*.yml" -o -name "*.html" \) \
  -print0 | while IFS= read -r -d '' file; do
  process_file "$file"
done

echo "License addition complete."
