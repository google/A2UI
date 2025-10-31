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


# a2ui_schema.py

import os

_A2UI_SCHEMA_FILE = os.path.join(
    os.path.dirname(__file__),
    '..',
    '..',
    'specification',
    'json',
    'server_to_client.json',
)

with open(_A2UI_SCHEMA_FILE, 'r') as f:
  A2UI_SCHEMA = f.read()
