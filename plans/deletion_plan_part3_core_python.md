# Plan: Delete Core Python Contact Sample (Part 3)

This plan covers the deletion of the core Python "Contact Lookup" sample files and references.

## Git Branch
`feature/delete-core-python-contact-sample`

## Files to Delete
- `samples/agent/adk/contact_lookup/`

## Files to Update
- `samples/agent/adk/pyproject.toml`: Remove `"contact_lookup"` from `members`.
- `samples/agent/adk/uv.lock`: Remove entry for `contact_lookup`.
- `samples/agent/adk/tests/test_examples_validation.py`: Remove test case for `contact_lookup`.
- `samples/agent/adk/orchestrator/README.md`: Remove references to contact lookup agent.
- `samples/agent/adk/orchestrator/agent_executor.py`: Fix docstring referencing "Contact AgentExecutor".
- `.github/workflows/python_samples_build.yml`: Remove "Build contact_lookup" step.

## Validation Steps

### Automated Tests
- Run tests in `samples/agent/adk/tests/test_examples_validation.py` to ensure no broken dependencies.
  - Command: `cd samples/agent/adk && uv run pytest tests/test_examples_validation.py`
