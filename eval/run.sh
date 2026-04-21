# Copyright 2025 The Flutter Authors.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/dart_and_flutter"
flutter test --concurrency=1 --dart-define=GEMINI_API_KEY=$GEMINI_API_KEY
