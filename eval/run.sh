#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/dart_and_flutter"
flutter test --dart-define=GEMINI_API_KEY=$GEMINI_API_KEY
