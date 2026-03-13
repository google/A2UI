# A2UI C++ Agent implementation

The `a2a_agents/cpp/` directory contains the C++ implementation of the A2UI agent library.

## Components

The library provides validation logic for A2UI protocol messages:

*   **`a2ui_validation`**: A library for validating A2UI JSON messages against the schema and semantic rules.
    *   Header: `include/a2ui/validation.hpp`
    *   Source: `src/validation.cpp`

## Running tests

The project uses CMake and GoogleTest.

1.  Navigate to the C++ agent directory:
    ```bash
    cd a2a_agents/cpp
    ```

2.  Create a build directory and configure:
    ```bash
    mkdir -p build
    cd build
    cmake ..
    ```

3.  Build and run the tests:
    ```bash
    make
    ./test_validation
    ```

## Dependencies

The following dependencies are automatically fetched via CMake `FetchContent`:
*   [nlohmann/json](https://github.com/nlohmann/json): JSON for Modern C++
*   [pboettch/json-schema-validator](https://github.com/pboettch/json-schema-validator): JSON Schema Validator for JSON for Modern C++
*   [GoogleTest](https://github.com/google/googletest): Google Testing and Mocking Framework