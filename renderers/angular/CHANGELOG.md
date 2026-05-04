## Unreleased

- (v0_9) Re-style the v0_9 catalog components using the default theme from
  `web_core`. [#1166](https://github.com/google/A2UI/pull/1166)
- [Breaking change] the `children` property value changed from `props().children().value() -> Child[]` to 
`props().children().value() -> Children`. This provides a type safe wrapper to access the child list, path and component template ID.

## 0.8.5

- Handle `TextField.type` renamed to `TextField.textFieldType`.
