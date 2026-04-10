# Conformance Testing

To ensure behavioral parity across all SDK implementations (Python, Kotlin, etc.), the project maintains a language-agnostic conformance suite in this directory.

## Suite Structure
*   `parser.yaml`: Contains test cases for the `A2uiStreamParser`, verifying chunk buffering, incremental yielding, and edge cases like cut tokens.
*   `validator.yaml`: Contains test cases for the `A2uiValidator`, verifying structural integrity, cycle detection, and reachability.
*   `conformance_schema.json`: The JSON schema that validates the structure of the YAML test files themselves.

## Usage in SDKs
Each language SDK must implement a test harness that:
1.  Reads the YAML files.
2.  Feeds the inputs to the language's specific implementation of the parser/validator.
3.  Asserts that the output matches the expected results defined in the YAML.

Refer to `agent_sdks/python/tests/conformance/test_conformance.py` for a reference implementation of a harness.
