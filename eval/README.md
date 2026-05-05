# A2UI Evaluation Framework

This folder contains evaluation tests (aka evals) for the A2UI project.
An evaluation test verifies that a prompt produces expected results conforming to the A2UI schema and semantic rules.

## Design

For a detailed overview of the design, secrets management, and contamination prevention, see the [DESIGN.md](DESIGN.md) file.

## Running Evaluations

To run the evaluations, you need to use the Inspect AI CLI via `uv`. Make sure you are in this directory (`evals/eval`).

### Prerequisites

Set your Gemini API key:

```bash
export GEMINI_API_KEY="your_api_key"
```

### Run Evals

To run the evaluations with a specific model (e.g., Gemini 2.0 Flash):

```bash
uv run env PYTHONPATH=. inspect eval tasks.py --model google/gemini-3-flash-preview --display plain
```
*Note: Setting `PYTHONPATH=.` is required for Inspect to find the `a2ui_eval` package.*

## Viewing Evaluation Results

Inspect AI provides a web-based log viewer to explore the results of your evaluations.

To start the log viewer:

```bash
uv run inspect view start
```

This will start a local web server (usually at `http://localhost:7575`) and open the viewer in your browser. It will automatically load logs from the `logs/` directory.

## Listing Available Models

To list the available Gemini models supported by your API key:

```bash
uv run env PYTHONPATH=. inspect eval tasks.py -T list_models=True --model google/gemini-3-flash-preview
```

(the `--model` flag is required even though it is ignored)

## Running Unit Tests

To run the unit tests for the evaluation framework (dataset loader, solvers, scorers):

```bash
uv run python -m pytest
```
