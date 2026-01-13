# Coding Style

This project follows Google's Open Source coding standards to ensure consistency and maintainability across the codebase. We expect all contributions—whether from humans or AI assistants—to adhere to these guidelines.

## General Philosophy

*   **Consistency**: The most important rule is to be consistent with the existing code. If you are editing a file, follow the style of that file.
*   **Readability**: Code should be optimized for reading, not writing. Clear variable names and comments are essential.
*   **Automation**: Whenever possible, use automated tools (linters, formatters) to enforce style.

## Python

We follow the [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html).

### Formatting & Linting

*   **Formatter**: We recommend using `black` or `yapf` configured to Google style.
*   **Linter**: Use `pylint` to check for errors and style violations.
*   **Imports**: Imports should be sorted. `isort` is a good tool for this.

### Key Naming Conventions

*   **Functions, Variables, Methods**: `snake_case` (e.g., `calculate_total`, `user_name`)
*   **Classes, Exceptions**: `PascalCase` (e.g., `HTTPRequest`, `DatabaseConnection`)
*   **Constants**: `UPPER_CASE_WITH_UNDERSCORES` (e.g., `MAX_RETRIES`, `DEFAULT_TIMEOUT`)
*   **Private Members**: Start with a single underscore (e.g., `_internal_helper`)

### Type Hinting

*   Use [Python type hints](https://docs.python.org/3/library/typing.html) for function arguments and return values.
*   This helps with static analysis and IDE autocompletion.

```python
def greet(name: str) -> str:
    return f"Hello, {name}"
```

## TypeScript

We follow the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html).

### Formatting & Linting

We use [gts](https://github.com/google/gts) (Google TypeScript Style), which provides a shared configuration for `eslint` and `prettier`.

To use `gts` in a new Typescript directory:
```bash
npx gts init
```

### Key Naming Conventions

*   **Variables, Functions, Methods**: `camelCase` (e.g., `fetchData`, `isValid`)
*   **Classes, Interfaces, Types**: `PascalCase` (e.g., `UserProfile`, `NetworkResponse`)
*   **Constants**: `UPPER_CASE` is often used for global constants, but `camelCase` is also acceptable for immutable local variables. Follow local consistency.
*   **Interfaces**: Do *not* use an `I` prefix (e.g., use `User` not `IUser`).

### Code Organization

*   **Files**: One component/class per file is preferred.
*   **Exports**: Use named exports over default exports to ensure consistent naming on import.

## Other Languages

*   **JSON**: Use 2 spaces for indentation.
*   **Markdown**: We use implementation-agnostic Markdown. Standard CommonMark or GFM is preferred.

## License Headers

All source files must include the standard Apache 2.0 license header.

```text
Copyright 2025 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
