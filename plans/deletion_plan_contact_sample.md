# Master Plan: Delete Contact Sample

The original plan grew too large and has been split into smaller, independent plans to facilitate execution and code review. Each part has its own target branch and validation steps.

## Sub-Plans

1.  **[Part 1: Lit Shell Cleanup](file:///usr/local/google/home/josemontesp/A2UI-fork/plans/deletion_plan_part1_lit_shell.md)**
    *   **Branch**: `feature/cleanup-lit-shell-contacts`
    *   **Scope**: Removing contact configurations from the Lit shell to avoid build breakage.
2.  **[Part 2: Composer Tool Cleanup](file:///usr/local/google/home/josemontesp/A2UI-fork/plans/deletion_plan_part2_composer.md)**
    *   **Branch**: `feature/cleanup-composer-contact-data`
    *   **Scope**: Removing contact-related data and widgets from the Composer tool.
3.  **[Part 3: SDK Tests Refactoring](file:///usr/local/google/home/josemontesp/A2UI-fork/plans/deletion_plan_part3_sdk_tests.md)**
    *   **Branch**: `feature/refactor-sdk-tests-restaurant`
    *   **Scope**: Updating Python SDK tests to use restaurant concepts.
4.  **[Part 4: Core Contact Sample Deletion](file:///usr/local/google/home/josemontesp/A2UI-fork/plans/deletion_plan_part4_core.md)**
    *   **Branch**: `feature/delete-core-contact-sample`
    *   **Scope**: Deleting the core Python and Angular samples, updating basic references and CI/CD.
5.  **[Part 5: Complex Samples Refactoring](file:///usr/local/google/home/josemontesp/A2UI-fork/plans/deletion_plan_part5_refactor_samples.md)**
    *   **Branch**: `feature/refactor-complex-samples-restaurant`
    *   **Scope**: Updating Gemini Enterprise and Custom Components samples to use restaurant concepts.

## Recommended Execution Order

The plans are numbered in the recommended execution order to minimize build breakage:
1.  **Part 1 (Lit Shell Cleanup)**
2.  **Part 2 (Composer Cleanup)**
3.  **Part 3 (SDK Tests)**
4.  **Part 4 (Core Deletion)**
5.  **Part 5 (Complex Samples)**
