# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Output mode configuration for A2UI system prompt generation."""

from enum import Enum


class A2UIOutputMode(Enum):
  """Controls how A2UI schema and instructions are delivered to the LLM.

  Attributes:
    TEXT: Schema is injected directly into the system prompt via
        generate_system_prompt(). The LLM outputs A2UI JSON wrapped in
        <a2ui-json> tags as part of its text response. This is the default.
    TOOL: Schema is provided via SendA2uiToClientToolset's
        process_llm_request(). The LLM calls the send_a2ui_json_to_client
        tool to deliver A2UI JSON. When using this mode,
        generate_system_prompt() automatically skips schema and example
        injection to prevent double-injection.
  """

  TEXT = "text"
  TOOL = "tool"
