cmake_minimum_required(VERSION 3.14)
project(a2ui_sdk_cpp LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)

# Fetch nlohmann/json
FetchContent_Declare(
  json
  GIT_REPOSITORY https://github.com/nlohmann/json.git
  GIT_TAG v3.11.2
)
FetchContent_MakeAvailable(json)

# Fetch json-schema-validator
FetchContent_Declare(
  json-schema-validator
  GIT_REPOSITORY https://github.com/pboettch/json-schema-validator.git
  GIT_TAG 2.4.0
)
FetchContent_MakeAvailable(json-schema-validator)

# Fetch GoogleTest
FetchContent_Declare(
  googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG v1.14.0
)
FetchContent_MakeAvailable(googletest)

# Fetch yaml-cpp
FetchContent_Declare(
  yaml-cpp
  GIT_REPOSITORY https://github.com/jbeder/yaml-cpp.git
  GIT_TAG 0.8.0
)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -include cstdint")
set(YAML_CPP_BUILD_TESTS OFF CACHE BOOL "Disable yaml-cpp tests" FORCE)
set(YAML_CPP_BUILD_TOOLS OFF CACHE BOOL "Disable yaml-cpp tools" FORCE)
FetchContent_MakeAvailable(yaml-cpp)

# Find repo root
set(REPO_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/../..")

# Generated file path
set(GENERATED_SCHEMAS_FILE "${CMAKE_CURRENT_BINARY_DIR}/generated/embedded_schemas.cc")

# Custom command to run Python script
add_custom_command(
  OUTPUT "${GENERATED_SCHEMAS_FILE}"
  COMMAND python3 "${CMAKE_CURRENT_SOURCE_DIR}/scripts/generate_embedded_schemas.py" "${REPO_ROOT}" "${GENERATED_SCHEMAS_FILE}"
  DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/scripts/generate_embedded_schemas.py"
          "${REPO_ROOT}/specification/v0_8/json/server_to_client.json"
          "${REPO_ROOT}/specification/v0_9/json/server_to_client.json"
          "${REPO_ROOT}/specification/v0_9/json/common_types.json"
  COMMENT "Generating embedded schemas..."
)

# Main library
add_library(a2ui_sdk
  src/schema/catalog.cc
  src/schema/manager.cc
  src/schema/validator.cc
  src/schema/common_modifiers.cc
  src/schema/utils.cc
  src/parser/parser.cc
  src/parser/streaming.cc
  src/parser/payload_fixer.cc
  src/template/manager.cc
  "${GENERATED_SCHEMAS_FILE}"
)

target_include_directories(a2ui_sdk PUBLIC include)
target_link_libraries(a2ui_sdk PUBLIC nlohmann_json::nlohmann_json nlohmann_json_schema_validator)

# Tests
add_executable(a2ui_tests
  tests/schema/test_catalog.cc
  tests/schema/test_schema_manager.cc
  tests/schema/test_validator.cc
  tests/parser/test_parser.cc
  tests/parser/test_payload_fixer.cc
  tests/parser/test_streaming_v08.cc
  tests/parser/test_streaming_v09.cc
)

target_link_libraries(a2ui_tests
  PRIVATE
    a2ui_sdk
    gtest_main
    yaml-cpp
)

include(GoogleTest)
gtest_discover_tests(a2ui_tests)
