#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/dart_and_flutter"
flutter test
