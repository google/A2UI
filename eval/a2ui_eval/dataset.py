"""Dataset loader for A2UI evaluation."""

import os
import yaml
from inspect_ai.dataset import MemoryDataset, Sample

def load_a2ui_dataset(file_path: str) -> MemoryDataset:
    """Loads A2UI evaluation samples from a YAML file."""
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
                **(item.get('metadata', {}))
            }
        ))
        
    return MemoryDataset(samples=samples)
