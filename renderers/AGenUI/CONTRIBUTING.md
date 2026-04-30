# Contributing to AGenUI

Thank you for your interest in AGenUI! AGenUI is a cross-platform UI rendering engine that bridges declarative UI descriptions with native rendering across iOS, Android, and HarmonyOS, powered by a shared C++ core. Contributions of all kinds are welcome — bug fixes, new features, documentation improvements, and test coverage all make the project better.

We are committed to providing a welcoming and inclusive environment for everyone. Please take a moment to read this guide before submitting your first contribution.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Reporting Bugs](#reporting-bugs)
- [Contributing Code](#contributing-code)
- [Code Style](#code-style)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Contact](#contact)

---

## Code of Conduct

We expect all participants to treat each other with respect and professionalism. By participating in this project, you agree to:

- Use welcoming and inclusive language.
- Be respectful of differing viewpoints and experiences.
- Accept constructive criticism gracefully.
- Focus on what is best for the community and the project.
- Show empathy toward other community members.

Unacceptable behavior includes harassment, personal attacks, trolling, and any form of discrimination. Violations may result in removal from the project community.

If you witness or experience unacceptable behavior, please report it by opening a **private** issue or contacting the maintainers directly (see [Contact](#contact)).

---

## Reporting Bugs

Before opening a bug report, please:

1. **Search existing issues** to avoid duplicates — the bug may already be known or fixed.
2. **Reproduce on the latest version** — the issue may have been resolved in a recent release.

### Creating a Bug Report

[Open a new issue](../../issues/new) and include the following information:

- **Environment**: OS version, device/simulator, AGenUI version, Xcode / Android Studio / DevEco Studio version.
- **Platform**: Which renderer is affected — iOS, Android, or HarmonyOS (or the C++ engine itself).
- **Steps to reproduce**: A minimal, self-contained sequence of steps that consistently triggers the bug.
- **Expected behavior**: What you expected to happen.
- **Actual behavior**: What actually happened, including any error messages, logs, or stack traces.
- **Additional context**: Screenshots, recordings, or links to a minimal reproduction repository if applicable.

The more detail you provide, the faster the issue can be resolved.

---

## Contributing Code

### Finding Something to Work On

- Feel free to submit a PR directly for small fixes like typos, minor bugs, or documentation improvements. 
- For larger changes — new features, significant refactors, or new platform support — we recommend opening an issue first to discuss the approach. This helps avoid duplicated effort and ensures the direction aligns with the project.

### Development Workflow

1. **Fork** the repository and clone your fork locally.
2. **Add upstream** remote: `git remote add upstream https://github.com/AGenUI/AGenUI.git`
3. **Create a branch** from `upstream/main` with a descriptive name (e.g. `fix/123-crash-on-nil-view`).
4. **Make your changes** — keep them focused on a single concern and include relevant tests.
5. **Build and test** locally on the affected platform(s) before pushing.
6. **Rebase** onto the latest upstream (`git fetch upstream && git rebase upstream/main`) to avoid merge conflicts.
7. **Push** your branch and open a pull request against `main`.

---

## Code Style

Consistent code style makes the codebase easier to read and review. Please configure your editor or IDE to respect the following guidelines before contributing.

### C++

Follow the **Google C++ Style Guide**:
[https://google.github.io/styleguide/cppguide.html](https://google.github.io/styleguide/cppguide.html)

### Swift

Follow the **Google Swift Style Guide**:
[https://google.github.io/swift/](https://google.github.io/swift/)

Supplementary reference — **Apple's Swift API Design Guidelines** (especially for public APIs and naming conventions):
[https://www.swift.org/documentation/api-design-guidelines/](https://www.swift.org/documentation/api-design-guidelines/)

### Java

Follow the **Google Java Style Guide**:
[https://google.github.io/styleguide/javaguide.html](https://google.github.io/styleguide/javaguide.html)

### ArkTS (ETS)

Follow the **OpenHarmony ArkTS Coding Style Guide**:
[https://gitee.com/openharmony/docs/blob/master/en/contribute/OpenHarmony-ArkTS-coding-style-guide.md](https://gitee.com/openharmony/docs/blob/master/en/contribute/OpenHarmony-ArkTS-coding-style-guide.md)



---

## Pull Request Guidelines

### Before Submitting

- [ ] The code compiles without errors or warnings on the target platform(s).
- [ ] New functionality is well tested.
- [ ] Code follows the style guide for the affected language.
- [ ] Commit messages are clear and in English.

### Review Process

- At least **one maintainer approval** is required before merging.
- Address all review comments before requesting a re-review.
- Before merging, squash fixup commits so each PR produces a clean, logical commit history.
- Do not close and re-open a PR to reset review state — push new commits to the same branch instead.

### Scope

- **One PR, one concern.** Do not combine unrelated fixes or features in a single PR.
- For large features (new platform support, significant engine changes), open a design discussion issue first and get maintainer sign-off before writing code.

---

## Contact

*(Coming soon — community channels will be announced here.)*

---

*Thank you for contributing to AGenUI. Every improvement, no matter how small, moves the project forward.*
