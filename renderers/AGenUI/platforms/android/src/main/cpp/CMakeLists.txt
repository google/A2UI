# CMakeLists.txt for AGenUI standalone Android AAR build
cmake_minimum_required(VERSION 3.18.1)

project("amap_AGenUI")

add_definitions(-DPLATFORM_ANDROID)
add_definitions(-D_GNU_SOURCE)
add_definitions(-DMT_MAIN=15)
add_definitions(-DMT_SUB=0)
add_definitions(-DCONFIG_VERSION="2025-09-13")

# C++ standard
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(COMMON_WARNING_FLAGS "-Wno-sign-compare -Wno-missing-field-initializers -Wno-unused-parameter")

# Common C flags
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${COMMON_WARNING_FLAGS}")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -funsigned-char")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fshort-wchar")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fvisibility=hidden")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Werror")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -ffunction-sections -fdata-sections")

# Common C++ flags
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${COMMON_WARNING_FLAGS}")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fshort-wchar")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fvisibility=hidden")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fvisibility-inlines-hidden")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Werror")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fno-rtti")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -ffunction-sections -fdata-sections")

if(CMAKE_BUILD_TYPE STREQUAL "Release")
    add_definitions(-DNDEBUG)
    set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} -O3 -fPIC -g")
    set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} -O3 -fPIC -g")
    # Link-time optimization
    set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} -flto")
    set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} -flto")
    set(CMAKE_SHARED_LINKER_FLAGS_RELEASE "${CMAKE_SHARED_LINKER_FLAGS_RELEASE} -flto")
    # Linker: remove unused code sections
    set(CMAKE_SHARED_LINKER_FLAGS_RELEASE "${CMAKE_SHARED_LINKER_FLAGS_RELEASE} -Wl,--gc-sections")
    # Strip symbol table (reduce .so size)
    set(CMAKE_SHARED_LINKER_FLAGS_RELEASE "${CMAKE_SHARED_LINKER_FLAGS_RELEASE} -Wl,--strip-all")
else()
    add_definitions(-DDEBUG)
    add_definitions(-D_DEBUG)
    set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -O0 -fPIC -g")
    set(CMAKE_C_FLAGS_DEBUG "${CMAKE_C_FLAGS_DEBUG} -O0 -fPIC -g")
endif()

# ============ Path to C++ engine (monorepo) ============
# AGENUI_REPO_ROOT is injected by platforms/android/build.gradle via -DAGENUI_REPO_ROOT=...
# It always points to the agenui/ repo root, avoiding .. traversal inside CMakeLists.
if(NOT DEFINED AGENUI_REPO_ROOT)
    message(FATAL_ERROR "AGENUI_REPO_ROOT is not defined. It must be passed via build.gradle externalNativeBuild arguments.")
endif()
set(AGENUI_CPP_ROOT "${AGENUI_REPO_ROOT}/engine")

include_directories(
    ${AGENUI_CPP_ROOT}/include
    ${AGENUI_CPP_ROOT}/src
    ${AGENUI_CPP_ROOT}/src/jni
    ${AGENUI_CPP_ROOT}/src/third_party
    ${AGENUI_CPP_ROOT}/src/third_party/nlohmann
    ${AGENUI_CPP_ROOT}/src/third_party/jschema_validator
)

# src/ root level cpp files (agenui_log.cpp, agenui_errorcode_define.cpp, etc.)
file(GLOB AGENUI_ROOT_SOURCES
    "${AGENUI_CPP_ROOT}/src/*.cpp"
)

# src/jni (JNI files for Android)
file(GLOB JNI_SOURCES
    "${AGENUI_CPP_ROOT}/src/jni/*.cpp"
)

# src/module
file(GLOB MODULE_SOURCES
    "${AGENUI_CPP_ROOT}/src/module/*.cpp"
)

# src/stream
file(GLOB STREAM_SOURCES
    "${AGENUI_CPP_ROOT}/src/stream/*.cpp"
)

# src/function_call
file(GLOB_RECURSE FUNCTIONCALL_SOURCES
    "${AGENUI_CPP_ROOT}/src/function_call/*.cpp"
)

# src/third_party/jschema_validator
file(GLOB JSCHEMA_SOURCES
    "${AGENUI_CPP_ROOT}/src/third_party/jschema_validator/*.cpp"
)

# src/surface (all subdirectories recursively)
file(GLOB_RECURSE SURFACE_SOURCES
    "${AGENUI_CPP_ROOT}/src/surface/*.cpp"
)

# Combine all sources
set(AGENUI_SOURCES
    ${AGENUI_ROOT_SOURCES}
    ${JNI_SOURCES}
    ${MODULE_SOURCES}
    ${STREAM_SOURCES}
    ${FUNCTIONCALL_SOURCES}
    ${JSCHEMA_SOURCES}
    ${SURFACE_SOURCES}
)

# ============ Exclude platform-specific and non-Android files ============
# Exclude Android platform invoker (JNI layer handles this instead)
list(FILTER AGENUI_SOURCES EXCLUDE REGEX ".*agenui_platform_invoker_android\\.cpp$")
# Exclude third_party/Html.cpp (Harmony only, not for Android/iOS)
list(FILTER AGENUI_SOURCES EXCLUDE REGEX ".*/third_party/Html.cpp")
# Exclude sax/ (Harmony only, not for Android/iOS)
list(FILTER AGENUI_SOURCES EXCLUDE REGEX ".*/third_party/sax/.*")
# Exclude yoga/ (Harmony only, not in Android all_srcs_path)
list(FILTER AGENUI_SOURCES EXCLUDE REGEX ".*/third_party/yoga/.*")
# Exclude ik/ (not in Android all_srcs_path)
list(FILTER AGENUI_SOURCES EXCLUDE REGEX ".*/third_party/ik/.*")
list(FILTER AGENUI_SOURCES EXCLUDE REGEX ".*/third_party/key_define.cpp")

# ============ Shared library ============
add_library(${CMAKE_PROJECT_NAME} SHARED
    ${AGENUI_SOURCES}
)

target_link_libraries(${CMAKE_PROJECT_NAME}
    z
    android
    log
)

# Note: -Wl,--no-wchar-size-warning is not supported by lld (Android NDK linker), omitted
target_link_options(${CMAKE_PROJECT_NAME} PRIVATE
    -Wl,-z,max-page-size=16384
)
