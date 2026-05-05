## Unreleased

- (v0_9) Re-style the v0_9 catalog components using the default theme from
  `web_core`. [#1166](https://github.com/google/A2UI/pull/1166)
- (v0_9) Improve type safety of `props()` in Catalog components. Custom catalog
  components should extend the base class `CatalogComponent` from
  `import {CatalogComponent} from '@a2ui/web_core/v0_9/'` or implement the
  interface `CatalogComponentInstance`. [#1320](https://github.com/google/A2UI/pull/1320)

## 0.8.5

- Handle `TextField.type` renamed to `TextField.textFieldType`.
