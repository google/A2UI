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

from abc import ABC, abstractmethod
from typing import List, Optional, Any


class InferenceStrategy(ABC):

  @abstractmethod
  def generate_system_prompt(
      self,
      role_description: str,
      workflow_description: str = "",
      ui_description: str = "",
      supported_catalog_ids: List[str] = [],
      allowed_components: List[str] = [],
      include_schema: bool = False,
      include_examples: bool = False,
  ) -> str:
    """
    Generates a system prompt for all LLM requests.

    Args:
      role_description: Description of the agent's role.
      workflow_description: Description of the workflow.
      ui_description: Description of the UI.
      supported_catalog_ids: List of supported catalog IDs.
      allowed_components: List of allowed components.
      include_schema: Whether to include the schema.
      include_examples: Whether to include examples.

    Returns:
      The system prompt.
    """
    pass
