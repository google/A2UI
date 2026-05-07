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

"""Dataset loader for A2UI evaluation."""

import os
import yaml
from inspect_ai.dataset import MemoryDataset, Sample

def load_a2ui_dataset(file_path: str) -> MemoryDataset:
    """Loads A2UI evaluation samples from a YAML file.

    Args:
        file_path: The path to the YAML dataset file.

    Returns:
        A MemoryDataset containing the resolved samples.

    Raises:
        FileNotFoundError: If the dataset file does not exist.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file not found: {file_path}")
        
    with open(file_path, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
        
    samples = []
    for item in data:
        samples.append(Sample(
            input=item.get('promptText') or item.get('input'),
            target=item.get('target') or item.get('description'),
            metadata={
                'name': item.get('name'),
                'description': item.get('description'),
                'context': item.get('context'),
                **(item.get('metadata', {}))
            }
        ))
        
    return MemoryDataset(samples=samples)
