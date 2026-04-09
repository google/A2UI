# Plan: Refactor SDK Tests to Restaurant (Part 3)

This plan covers refactoring the Python SDK tests to use restaurant concepts instead of contact concepts.

## Git Branch
`feature/refactor-sdk-tests-restaurant`

## Files to Update
- `agent_sdks/python/tests/parser/test_streaming_v08.py`: Refactor to use restaurant concepts.
- `agent_sdks/python/tests/parser/test_streaming_v09.py`: Refactor to use restaurant concepts.
- `agent_sdks/python/tests/integration/verify_load_real.py`: Refactor to use restaurant concepts.
- `agent_sdks/python/tests/schema/test_validator.py`: Update references to `"surfaceId": "contact-card"`.

## Validation Steps

### Automated Tests
- **Python SDK Tests**: Verify that the Python SDK tests pass after refactoring.
  - Command: `cd agent_sdks/python && uv run pytest`
