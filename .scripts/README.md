# A2UI Scripts

This directory contains maintenance scripts for the A2UI repository.

## Admin Tools

### `env_verify.py`

Located in `.scripts/devs/env_verify.py`.

This script verifies that the development environment is correctly set up for A2UI. It checks:
- Python version
- `uv` installation
- Authentication (API Key or ADC)
- LLM Connectivity

**Usage:**

It is recommended to use the `Makefile` in the root directory:

```bash
make env-verify
```

Or run directly:

```bash
python3 .scripts/devs/env_verify.py
```

### `samples_verify.py`

Located in `.scripts/admin/samples_verify.py`.

This script is for maintainers to verify that samples are working correctly.

**Usage:**

```bash
make samples-verify
```

### `env_debug.py`

Located in `.scripts/admin/env_debug.py`.

This script collects system information and environment variables to help debug issues. It masks sensitive values (like API keys) and saves a report to `a2ui_env_debug.txt` in the root directory.

**Usage:**

```bash
make env-debug
```
