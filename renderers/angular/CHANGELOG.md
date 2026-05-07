## Unreleased

- Improve type safety of `props()` in Catalog components. Custom catalog
  components should extend the base class `CatalogComponent` from
  `import {CatalogComponent} from '@a2ui/web_core/v0_9/'` or implement the
  interface `CatalogComponentInstance`. [#1320](https://github.com/google/A2UI/pull/1320)
- **BREAKING CHANGE**: `children` props now expose a typed `value` signal, and have a new `template` field. This provides a type safe structure to access the child list, path and component template ID. [#1312](https://github.com/google/A2UI/pull/1312)

## 0.9.0

- Re-style the v0_9 catalog components using the default theme from
  `web_core`. [#1166](https://github.com/google/A2UI/pull/1166)

## 0.8.5

- Handle `TextField.type` renamed to `TextField.textFieldType`.
