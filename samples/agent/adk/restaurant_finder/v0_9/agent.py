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

import os
from a2ui.core.schema.constants import VERSION_0_9
from ..agent import RestaurantAgent
from ..prompt_builder import UI_DESCRIPTION_V0_9

class RestaurantAgentV09(RestaurantAgent):
  """Restaurant Agent specialized for A2UI v0.9."""

  def __init__(self, base_url: str, use_ui: bool = False):
    examples_path = os.path.join(os.path.dirname(__file__), "examples")
    super().__init__(
        base_url=base_url,
        version=VERSION_0_9,
        examples_path=examples_path,
        ui_description=UI_DESCRIPTION_V0_9,
        use_ui=use_ui,
    )
