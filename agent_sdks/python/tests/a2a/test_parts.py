# Copyright 2025 Google LLC
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

from a2a.types import DataPart, TextPart, Part
from a2ui.a2a.parts import (
    create_a2ui_part,
    is_a2ui_part,
    get_a2ui_datapart,
)


def test_a2ui_part_serialization():
  a2ui_data = {"beginRendering": {"surfaceId": "test-surface", "root": "root-column"}}

  part = create_a2ui_part(a2ui_data)

  assert is_a2ui_part(part), "Should be identified as A2UI part"

  data_part = get_a2ui_datapart(part)
  assert data_part is not None, "Should contain DataPart"
  assert a2ui_data == data_part.data, "Deserialized data should match original"


def test_non_a2ui_data_part():
  part = Part(
      root=DataPart(
          data={"foo": "bar"},
          metadata={"mimeType": "application/json"},  # Not A2UI
      )
  )
  assert not is_a2ui_part(part), "Should not be identified as A2UI part"
  assert get_a2ui_datapart(part) is None, "Should not return A2UI DataPart"


def test_non_a2ui_part():
  text_part = TextPart(text="this is some text")
  part = Part(root=text_part)

  assert not is_a2ui_part(part), "Should not be identified as A2UI part"
  assert get_a2ui_datapart(part) is None, "Should not return A2UI DataPart"
