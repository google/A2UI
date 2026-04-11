## Unreleased

- **BREAKING CHANGE**: Renamed `createReactComponent` to `createComponentImplementation`.
- **BREAKING CHANGE**: Renamed `createBinderlessComponent` to `createBinderlessComponentImplementation`.
- **Fix**: Icon camelCase-to-snake_case conversion no longer prepends underscore to capitalized names. Added `ICON_MAP` for icons that don't follow standard naming (e.g. `play` → `play_arrow`).
- **Fix**: Markdown list parser no longer drops continuation lines within list items.
- **Fix**: Heading variants (`h1`–`h5`) now set explicit `fontSize`/`fontWeight` to work under CSS resets.
- **Fix**: Tabs uses container margin (not leaf) and `overflow: hidden`; tab buttons flex-distribute evenly with text truncation.
- **Fix**: Card adds `overflow: hidden` to contain child content.
- **Fix**: Column adds `minWidth: 0` so flex children can shrink below content size.
- **Fix**: Weight wrapper adds `minHeight: 0` for vertical flex layouts.

## 0.8.1

- Use the `InferredComponentApiSchemaType` from `web_core` in `createComponentImplementation`.
- Adjust internal type in `Tabs` widget.

## 0.8.0

- Initial release.
