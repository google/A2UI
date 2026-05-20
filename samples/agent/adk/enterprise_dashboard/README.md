# Enterprise Dashboard Sample

A visual-first analytics agent that renders business data as compact A2UI
component layouts instead of markdown text walls.

## Why this sample exists

LLMs default to markdown when presenting data — tables, bullet lists, headers.
This produces verbose "walls of text" that are hard to scan and don't leverage
A2UI's component system. This sample demonstrates the prompt engineering
patterns that produce compact, information-dense visual layouts.

## Layout Patterns

| Data Type | Markdown (bad) | A2UI (good) |
|-----------|---------------|-------------|
| KPI metrics | Inline numbers in paragraphs | Row of Card components with bold Text |
| Comparisons | Markdown table | Row of Card components side-by-side |
| Rankings | Numbered list | List with Card children |
| Multi-section | Multiple markdown headers | Tabs component |
| Separators | `---` or blank lines | Divider component |
| Status | Text like "up" or "down" | Icon (trending_up, trending_down) |

## Key prompt techniques

1. **Anti-markdown rules** — Explicit bans with A2UI alternatives:
   "NEVER use markdown tables — use Row + Card instead."

2. **Layout recipes** — Map each data type to a component composition:
   "KPI metrics: Row of Card components, each with bold metric Text."

3. **Output ordering** — A2UI JSON first, brief text after:
   "Output A2UI JSON block(s) FIRST, then at most 1-2 sentences."

4. **Component diversity** — Prevent monotonous layouts:
   "Minimum 3 different component types per response."

## Running

```bash
cd samples/agent/adk
adk web enterprise_dashboard
```

Then try these queries:
- "Show me this week's KPIs"
- "Compare store performance"
- "What are the top 5 products?"
- "Give me a full dashboard with KPIs, store comparison, and top products"

## Example output

See `examples/0.8/` for reference A2UI JSON payloads:
- `kpi_dashboard.json` — 4 KPI metric cards in a Row layout
- `store_comparison.json` — 3 store cards with Icon status indicators

## Related PRs

- [#1465](https://github.com/google/A2UI/pull/1465) — `strict_output` mode
  for `generate_system_prompt()` (SDK-level enforcement)
- [#1466](https://github.com/google/A2UI/pull/1466) — `A2UIOutputMode` enum
  for unified TEXT/TOOL prompt generation
