# Plan: Delete Core Angular Contact Sample (Part 4)

This plan covers the deletion of the Angular "Contact Lookup" client and related tool assets.

## Git Branch
`feature/delete-core-angular-contact-sample`

## Files to Delete
- `samples/client/angular/projects/contact/`
- `tools/composer/public/images/contact_lookup/`
- `tools/composer/src/data/theater/contact-lookup.json`

## Files to Update
- `samples/client/angular/angular.json`: Remove `"contact"` project configuration.
- `samples/client/angular/tsconfig.json`: Remove references to `projects/contact/tsconfig.app.json` and `tsconfig.spec.json`.
- `samples/client/angular/package.json`: Remove `"serve:ssr:contact"` script.
- `samples/client/angular/README.md`: Remove references to contact app.
- `samples/client/angular/projects/orchestrator/src/app/app.html`: Remove or update "List all contacts" button.
- `tools/composer/src/data/theater/index.ts`: Remove import and usage of `contact-lookup.json`.
- `.github/workflows/ng_build_and_test.yml`: Remove "Build contact sample" step.

## Validation Steps

### Build Validation
- **Tools Composer**: Verify that `tools/composer` still builds correctly.
  - Command: `cd tools/composer && pnpm build`
- **Angular Workspace**: Verify that the Angular workspace still builds.
  - Command: `cd samples/client/angular && npm run build`
