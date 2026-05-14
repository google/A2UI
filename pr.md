# refactor(web_core): configurable recursion depth

## Summary
This PR allows developers to override the hard-coded recursion depth limit in `DataValueSchema` while maintaining backward compatibility.

## Changes
- Refactored `DataValueSchema` in `renderers/web_core/src/v0_8/schema/common-types.ts` from a static constant to a factory function `createDataValueSchema(options?: { maxDepth?: number })`.
- Exported the original `DataValueSchema` as a constant using the default limit of 5.
- Added a new test file `renderers/web_core/src/v0_8/schema/common-types.test.ts` to verify the recursion depth limits.

## Impact & Risks
- **Backward Compatibility**: The default `DataValueSchema` behavior is unchanged, so there should be no breaking changes for existing usages.
- **Risk**: Low, as it only affects schema validation if someone explicitly opts into a custom depth.

## Testing
- Added new unit tests in `common-types.test.ts` to verify default and custom depth limits.
- Ran tests manually using `node --test dist/src/v0_8/schema/common-types.test.js`.
