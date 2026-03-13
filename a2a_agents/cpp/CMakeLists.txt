cmake_minimum_required(VERSION 3.14)
project(A2UI_CPP_Agent)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)

include(FetchContent)

# nlohmann/json
FetchContent_Declare(
    nlohmann_json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG        v3.11.3
)
FetchContent_MakeAvailable(nlohmann_json)

# pboettch/json-schema-validator
FetchContent_Declare(
    nlohmann_json_schema_validator
    GIT_REPOSITORY https://github.com/pboettch/json-schema-validator.git
    GIT_TAG        2.3.0
)
FetchContent_MakeAvailable(nlohmann_json_schema_validator)

# GoogleTest
FetchContent_Declare(
    googletest
    GIT_REPOSITORY https://github.com/google/googletest.git
    GIT_TAG        v1.14.0
)
# For Windows: Prevent overriding the parent project's compiler/linker settings
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

# library: a2ui_validation
add_library(a2ui_validation src/validation.cpp)
target_include_directories(a2ui_validation PUBLIC include)
target_link_libraries(a2ui_validation PUBLIC nlohmann_json::nlohmann_json nlohmann_json_schema_validator)

# executable: test_validation
enable_testing()
add_executable(test_validation tests/test_validation.cpp)
target_link_libraries(test_validation PRIVATE a2ui_validation GTest::gtest_main GTest::gmock)

include(GoogleTest)
gtest_discover_tests(test_validation)
