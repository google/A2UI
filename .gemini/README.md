# Gemini Configuration

This directory (`.gemini/`) contains configuration and context files for Google's Gemini tools, including:

- **`gemini-cli`**: The command-line interface for Gemini.
- **Gemini Code Assist**: An AI-powered assistant that integrates with GitHub and IDEs and provides for automated code reviews, among other features.

The files in this directory are used to customize the behavior of these tools for this specific repository.

- **`GEMINI.md`**: Provides project-specific context, instructions, and guidelines that are included in the context when using Gemini CLI and Code Assist. This helps the AI understand the project's conventions and requirements.
- **`config.yaml`**: Configuration for the Gemini for GitHub tools, such as settings for code review.
- **`styleguide.md`**: Contains the project's style guide, which is used by the Gemini for Github tools to ensure that generated reviews adhere to the project's conventions.
- **`commands/`**: A directory containing custom command definitions (e.g., `fix_code.toml`) for the Gemini CLI.

## Documentation

- [Gemini CLI Documentation](https://github.com/google-gemini/gemini-cli)
- [Gemini Code Assist Documentation](https://cloud.google.com/products/gemini/code-assist)
