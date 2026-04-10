# Master Plan: Delete Contact Sample

The original plan grew too large and has been split into smaller, independent plans to facilitate execution and code review. Each part has its own target branch and validation steps.

## Sub-Plans

1.  **[Part 1: Lit Shell Cleanup](file:///usr/local/google/home/josemontesp/A2UI-fork/plans/deletion_plan_part1_lit_shell.md)**
    *   **Branch**: `feature/cleanup-lit-shell-contacts`
    *   **Scope**: Removing contact configurations from the Lit shell to avoid build breakage.
2.  **[Part 2: SDK Link Removal](file:///usr/local/google/home/josemontesp/A2UI-fork/plans/deletion_plan_part2_sdk_link_removal.md)**
    *   **Branch**: `feature/remove-sdk-contact-link`
    *   **Scope**: Removing the contact_lookup link from `agent_development.md`.
3.  **[Part 3: Core Python Contact Sample Deletion](file:///usr/local/google/home/josemontesp/A2UI-fork/plans/deletion_plan_part3_core_python.md)**
    *   **Branch**: `feature/delete-core-python-contact-sample`
    *   **Scope**: Deleting the core Python sample and updating references.
4.  **[Part 4: Core Angular Contact Sample Deletion](file:///usr/local/google/home/josemontesp/A2UI-fork/plans/deletion_plan_part4_core_angular.md)**
    *   **Branch**: `feature/delete-core-angular-contact-sample`
    *   **Scope**: Deleting the Angular client project and related tool assets.

## Recommended Execution Order

The active plans should be executed in the following order:
1.  **Part 1 (Lit Shell Cleanup)**
2.  **Part 2 (SDK Link Removal)**
3.  **Part 3 (Core Python Deletion)**
4.  **Part 4 (Core Angular Deletion)**
