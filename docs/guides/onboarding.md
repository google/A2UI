# Contributor Onboarding

This guide helps first-time contributors, students, and hackathon teams get from zero to their first PR.

## 1. Pick a path (15-30 minutes)

- **Run the demo**: Follow the [Quickstart](../quickstart.md) to see A2UI end-to-end.
- **Build a renderer**: Start with [Client Setup](client-setup.md).
- **Build an agent**: See [Agent Development](agent-development.md).
- **Docs-only contribution**: Update guides, fix typos, or add examples (lowest risk).

## 2. Prerequisites

- **Node.js** v18+
- **Python** 3.10+ (only for agent demos)
- **uv** (Python package manager) for agent demos
- **Gemini API key** (only required for agent demos)

If you only want to contribute docs, you do not need Python or an API key.

## 3. Run something locally (fast path)

```bash
git clone https://github.com/google/A2UI.git
cd A2UI
```

Then follow the [Quickstart](../quickstart.md) for the one-command demo.

## 4. Find a starter task

Good places to start:

- [good first issue](https://github.com/google/A2UI/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- [documentation](https://github.com/google/A2UI/issues?q=is%3Aissue+is%3Aopen+label%3Adocumentation)
- [help wanted](https://github.com/google/A2UI/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)

If you are new, docs issues are the quickest way to get a PR merged.

## 5. Make a change

```bash
git checkout -b your-branch-name
# edit files
```

- Keep changes small and focused.
- If you touched code, run the relevant tests.
- For docs-only changes, a quick review is usually enough.

## 6. Open a PR

Before opening a PR, sign the [Google CLA](https://cla.developers.google.com/about).

Then open a PR against `main` and include:

- A short summary of what changed
- A link to the issue (if there is one)
- Any test results (or note "docs-only")

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for full details.

## 7. After you open the PR

- Respond to review comments
- Keep the PR focused; follow-up changes can be new PRs
- If CI fails, push a fix and re-run checks