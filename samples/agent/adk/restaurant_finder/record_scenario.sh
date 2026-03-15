#!/bin/bash
source ~/.openclaw/credentials/secrets.sh
export GEMINI_API_KEY="$GEMINI_API_KEY_ALAN_WORK"
uv run record_scenario.py
