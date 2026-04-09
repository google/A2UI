# Plan: Refactor Complex Samples to Restaurant (Part 5)

This plan covers refactoring the complex samples (Gemini Enterprise and Custom Components) to use restaurant concepts instead of contact concepts.

## Git Branch
`feature/refactor-complex-samples-restaurant`

## Files to Update
- `samples/agent/adk/gemini_enterprise/`: Refactor both `agent_engine` and `cloud_run` to use the restaurant sample instead of contact lookup.
- `samples/agent/adk/custom-components-example/`: Refactor to use restaurant sample.
- `samples/client/lit/custom-components-example/contact.ts`: Refactor to use restaurant sample.

## Validation Steps

### Automated Tests
- **Python Samples Tests**: Verify that the sample agents are valid.
  - Command: `cd samples/agent/adk && uv run pytest`

### Manual Verification
- **Smoke Test Refactored Samples**: The agent will build and start the refactored sample applications, and the USER will manually verify that they are working correctly in a browser.
