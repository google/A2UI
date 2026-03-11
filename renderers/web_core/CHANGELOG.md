## 0.8.5

- Add `V8ErrorConstructor` interface to be able to access V8-only 
  `captureStackTrace` method in errors.
- Removes dependency from `v0_8` to `v0_9` by duplicating the `errors.ts` file.

## 0.8.4

- Tweak v0.8 Schema for Button and TextField to better match the spec.

## 0.8.3

- The `MarkdownRenderer` type is now async and returns a `Promise<string>`.
