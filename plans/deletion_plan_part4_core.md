# Plan: Delete Core Contact Sample (Part 4)

This plan covers the deletion of the core "Contact Lookup" sample files and references.

## Git Branch
`feature/delete-core-contact-sample`

## Files to Delete

### Directories
- `samples/agent/adk/contact_lookup/`
- `samples/client/angular/projects/contact/`
- `tools/composer/public/images/contact_lookup/`

### Files
- `tools/composer/src/data/theater/contact-lookup.json`

## Files to Update

### Python Agent References
- `samples/agent/adk/pyproject.toml`: Remove `"contact_lookup"` from `members`.
- `samples/agent/adk/uv.lock`: Remove entry for `contact_lookup`.
- `samples/agent/adk/tests/test_examples_validation.py`: Remove test case for `contact_lookup`.
- `samples/agent/adk/orchestrator/README.md`: Remove references to contact lookup agent.
- `samples/agent/adk/orchestrator/agent_executor.py`: Fix docstring referencing "Contact AgentExecutor".

### Client References
- `samples/client/angular/angular.json`: Remove `"contact"` project configuration.
- `samples/client/angular/tsconfig.json`: Remove references to `projects/contact/tsconfig.app.json` and `tsconfig.spec.json`.
- `samples/client/angular/package.json`: Remove `"serve:ssr:contact"` script.
- `samples/client/angular/README.md`: Remove references to contact app.
- `samples/client/angular/projects/orchestrator/src/app/app.html`: Remove or update "List all contacts" button.

### Tools References
- `tools/composer/src/data/theater/index.ts`: Remove import and usage of `contact-lookup.json`.

### CI/CD Workflow References
- `.github/workflows/python_samples_build.yml`: Remove "Build contact_lookup" step.
- `.github/workflows/ng_build_and_test.yml`: Remove "Build contact sample" step.

## Validation Steps

### Build Validation
- **Tools Composer**: Verify that `tools/composer` still builds correctly.
  - Command: `cd tools/composer && pnpm build`
- **Angular Workspace**: Verify that the Angular workspace still builds.
  - Command: `cd samples/client/angular && npm run build`

### Automated Tests
- Run tests in `samples/agent/adk/tests/test_examples_validation.py` to ensure no broken dependencies.
  - Command: `cd samples/agent/adk && uv run pytest tests/test_examples_validation.py`
