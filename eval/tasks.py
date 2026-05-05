"""Tasks for A2UI evaluation."""
# pylint: disable=duplicate-code

import os
import sys
from google import genai
from google.genai import errors
from inspect_ai import task, Task
from inspect_ai.solver import generate
from inspect_ai.dataset import MemoryDataset, Sample
from inspect_ai.scorer import scorer, Score
from a2ui_eval.dataset import load_a2ui_dataset
from a2ui_eval.solvers import a2ui_system_prompt
from a2ui_eval.scorers import a2ui_scorer

# Paths relative to the eval directory where we run inspect
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "../datasets/v0_9_prompts.yaml"))
SCHEMA_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "../specification/v0_9/json/server_to_client.json"))
CATALOG_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "../specification/v0_9/json/basic_catalog.json"))

@task
def a2ui_v0_9_eval(list_models: bool = False) -> Task:
    """Evaluation task for A2UI v0.9 protocol generation."""
    
    if list_models:
        client = genai.Client()
        print("\nAvailable Gemini Models:")
        try:
            for m in client.models.list():
                print(f"- {m.name}")
        except errors.APIError as e:
            print(f"Error listing models: {e}")
        # Return a dummy task to exit gracefully without errors
        
        @scorer(metrics=[])
        def dummy_scorer():
            async def score(state, target):  # pylint: disable=unused-argument
                return Score(value=1.0, explanation="Dummy pass")
            return score
            
        return Task(
            dataset=MemoryDataset(samples=[Sample(input="dummy", target="dummy")]),
            solver=[],
            scorer=[dummy_scorer()]
        )
        
    dataset = load_a2ui_dataset(DATASET_PATH)
    
    return Task(
        dataset=dataset,
        solver=[
            a2ui_system_prompt(SCHEMA_PATH, CATALOG_PATH),
            generate()
        ],
        scorer=[a2ui_scorer(CATALOG_PATH)]
    )
