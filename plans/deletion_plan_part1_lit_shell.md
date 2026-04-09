# Plan: Cleanup Lit Shell Contacts (Part 1)

This plan covers the removal of contact-related configurations from the Lit shell.

## Git Branch
`feature/cleanup-lit-shell-contacts`

## Files to Delete
- `samples/client/lit/shell/configs/contacts.ts`

## Files to Update
- `samples/client/lit/shell/app.ts`: Update to remove import of `configs/contacts.ts` and set default to `restaurant`.
  - *Important*: Perform this update *before* deleting `configs/contacts.ts` to avoid breaking the build.
- `samples/client/lit/shell/package.json`: Remove `"demo:contact"` script.
- `samples/client/lit/package.json`: Remove `"serve:agent:contact_lookup"` and `"demo:contact"` scripts.

## Validation Steps

### Build Validation
- Verify that the Lit shell still builds.
  - Command: `cd samples/client/lit/shell && npm run build`
