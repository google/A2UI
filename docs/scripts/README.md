# Documentation Transformation Scripts

This directory contains utility scripts to prepare our documentation for the **MkDocs** build process.

## Alert/Admonition Conversion (`convert_docs.py`)

### Purpose

To ensure a great reading experience both on GitHub and the hosted site, we use **GitHub-flavored Markdown** as our primary source of truth. This script transforms GitHub's native syntax into **MkDocs-compatible syntax** (specifically for the `pymdown-extensions`) during the build pipeline.

The script performs a uni-directional transformation: **GitHub Markdown → MkDocs Syntax**.

- GitHub uses a blockquote-based syntax for alerts.
- MkDocs requires the `!!!` or `???` syntax to render colored callout boxes.

### Running the Conversion

The conversion is run as part of the build pipeline. No additional steps are required. If you need to run the conversion manually, you can run the `convert_docs.py` script in the repository root.

```bash
python docs/scripts/convert_docs.py
```

### Example

- **Source (GitHub-flavored Markdown):**
  ```markdown
  > ⚠️ **Attention**
  >
  > This is an alert.
  ```

- **Target (MkDocs Syntax):**
  ```markdown
  !!! warning "Attention"
      This is an alert.
  ```

## Specification Preparation (`prepare_docs.py`)

This script prepares the raw specification files for the build.

### Purpose

- **Copies Source Files**: Moves specs from `specification/v0_X` to `docs/v0.X/specification`.
- **Flattens JSON**: Moves JSON files to the root of the versioned spec directory.
- **Rewrites Links**: Adjusts internal links to work in the new location.

### Usage

```bash
python docs/scripts/prepare_docs.py
```

## Wrapper Migration (`migrate_wrappers.py`)

This script manages the "wrapper" files that include the raw specification content.

### Purpose

- **Generates Wrappers**: Reads templates from `docs/wrappers_source/`.
- **Updates Includes**: Rewrites `--8<--` includes to point to the `prepare_docs.py` output.
- **Fixes Cross-Version Links**: Ensures links between different versions (e.g. v0.9 -> v0.8) are correct.

### Usage

```bash
python docs/scripts/migrate_wrappers.py
```
