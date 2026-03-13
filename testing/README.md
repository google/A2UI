# A2UI Cross-Renderer Testing

Tools for verifying component coverage parity across A2UI renderers.

## Coverage Matrix

Compares registered component types across the v0.10 specification, Lit renderer, and Angular renderer. Catches missing components and naming mismatches.

### Usage

```bash
node testing/coverage-matrix.mjs
```

**No dependencies required** — uses only Node.js builtins (`fs`, `path`).

### What it checks

1. Reads the v0.10 spec's `standard_catalog.json` for the canonical component list
2. Scans the Lit renderer (`renderers/lit/src/0.8/ui/root.ts`) for registered `case` handlers
3. Scans the Angular renderer (`renderers/angular/src/lib/catalog/default.ts`) for `DEFAULT_CATALOG` entries
4. Outputs a matrix showing which components each renderer supports vs the spec
5. Exits with code 1 if any spec component is missing from a renderer

### Current Status

| | Spec (v0.10) | Lit (v0.8.1) | Angular (v0.8.4) |
|---|:---:|:---:|:---:|
| Components | 18 | 18 | 18 |
| Parity | — | ✅ | ✅ |

> **Note:** Both renderers use the v0.8 name `MultipleChoice` which was renamed to `ChoicePicker` in v0.10. The script accounts for this rename.

### CI Integration

```yaml
# Example GitHub Actions step
- name: Check renderer coverage
  run: node testing/coverage-matrix.mjs
```

The script exits 0 on full coverage, 1 on any missing components.
