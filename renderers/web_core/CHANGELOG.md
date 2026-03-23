## 0.8.7

- Adds `catalogId` to v0.8 schemas (was removed by mistake earlier)
- Tweak schema definitions so they survive minification.

## 0.8.6

- Update logical functions (`and`, `or`) to require a `values` array argument, removing deprecated individual arguments.
- Update `formatDate` to require `format` parameter to align with new configuration, utilizing `date-fns`.
- Add `date-fns` dependency for expression string formatting workflows.
- Update math and comparison expression schemas with preprocessing step to correctly coerce `null` parameters into `undefined` for tighter validation constraints.
- Fix associated tests in expressions and rendering models corresponding to validation updates.
- Improve error messages to include the function name and the catalog ID.

## 0.8.5

- Add `V8ErrorConstructor` interface to be able to access V8-only
  `captureStackTrace` method in errors.
- Removes dependency from `v0_8` to `v0_9` by duplicating the `errors.ts` file.

## 0.8.4

- Tweak v0.8 Schema for Button and TextField to better match the spec.

## 0.8.3

- The `MarkdownRenderer` type is now async and returns a `Promise<string>`.
