# Plan: Cleanup Composer Contact Data (Part 2)

This plan covers the removal of contact-related data and widgets from the Composer tool.

## Git Branch
`feature/cleanup-composer-contact-data`

## Files to Delete
- `tools/composer/src/data/theater/contact-card.json`
- `tools/composer/src/data/theater/floor-plan.json`
- `tools/composer/src/data/gallery/contact-card.ts`

## Files to Update
- `tools/composer/src/data/gallery/index.ts`: Remove reference to `contact-card.ts`.
- `tools/composer/src/lib/components-data.ts`: Update string `"contact-form"` to `"restaurant-form"`.

## Validation Steps

### Build Validation
- **Tools Composer**: Verify that `tools/composer` still builds correctly.
  - Command: `cd tools/composer && pnpm build`

### Automated Tests
- **Composer Tool Tests**: Verify that the Composer tool tests pass.
  - Command: `cd tools/composer && pnpm test`
