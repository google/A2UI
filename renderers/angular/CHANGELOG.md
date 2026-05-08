## Unreleased

- **BREAKING CHANGE**: (v0_9) Rename Icon `path` property to `svgPath` to fix type collision and avoid forced casts.
- (v0_9) Re-style the v0_9 catalog components using the default theme from
  `web_core`. [#1166](https://github.com/google/A2UI/pull/1166)
- (v0_9) Improve type safety of `props()` in Catalog components. Custom catalog
  components should extend the base class `CatalogComponent` from
  `import {CatalogComponent} from '@a2ui/web_core/v0_9/'` or implement the
  interface `CatalogComponentInstance`. [#1320](https://github.com/google/A2UI/pull/1320)
- [Breaking] `BoundProperty.raw` is now `unknown` instead of `any`. Recommended migration: replace `raw` access with typed sibling fields where available (e.g. use the new `template` field instead of `raw.componentId`/`raw.path`). [#1312](https://github.com/google/A2UI/pull/1312)
- [Breaking] `BoundProperty<T = unknown>`: the default generic is now `unknown` instead of `any`. Recommended migration: provide explicit type arguments (e.g. `BoundProperty<string>`) at usage sites that previously relied on the default. Code typed via `ComponentApiToProps<Api>` is unaffected. [#1312](https://github.com/google/A2UI/pull/1312)
- `props()['children']?.value()` is now typed `Child[]` (was `Child`, despite runtime always returning an array). [#1312](https://github.com/google/A2UI/pull/1312)

## 0.8.5

- Handle `TextField.type` renamed to `TextField.textFieldType`.
