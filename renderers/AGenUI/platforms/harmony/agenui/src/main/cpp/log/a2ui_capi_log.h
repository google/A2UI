#pragma once

/**
 * @file a2ui_capi_log.h
 * @brief Unified A2UI CAPI log macro definitions
 *
 * Provides a unified logging interface that automatically records the file name, line number, and function name
 * All logs use the "a2ui-capi" tag
 * Follows the design pattern used by agenui_log.h
 */

#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <hilog/log.h>

#undef LOG_DOMAIN
#undef LOG_TAG
#define LOG_DOMAIN 0x0
#define LOG_TAG "a2ui-capi"

// Maximum size of a single formatted log line (in bytes, including the trailing NUL).
// Messages longer than this will be truncated by vsnprintf.
constexpr size_t kLogFormatBufferSize = 8000;

/**
 * @brief HarmonyOS log formatting function
 * 
 * @param level Log level
 * @param func Function name
 * @param line Line number
 * @param format Format string
 * @param ... Variadic arguments
 */
inline void a2ui_capi_log_format(LogLevel level, const char* func, int line, const char* format, ...) {
    va_list vl;
    va_start(vl, format);
    char buf[kLogFormatBufferSize];
    vsnprintf(buf, sizeof(buf), format, vl);
    OH_LOG_Print(LOG_APP, level, 0x0, "a2ui-capi", "[%{public}s@%{public}d] %{public}s", func, line, buf);
    va_end(vl);
}

/**
 * @brief HarmonyOS assertion log formatting function
 * 
 * @param level Log level
 * @param file File name
 * @param func Function name
 * @param line Line number
 * @param format Format string
 * @param ... Variadic arguments
 */
inline void a2ui_capi_assert_log_format(LogLevel level, const char* file, const char* func, int line, const char* format, ...) {
    va_list vl;
    va_start(vl, format);
    char buf[kLogFormatBufferSize];
    vsnprintf(buf, sizeof(buf), format, vl);
    OH_LOG_Print(LOG_APP, level, 0x0, "a2ui-capi", "[%{public}s:%{public}d][%{public}s] %{public}s", file, line, func, buf);
    va_end(vl);
}

// Redefine all log macros to use the a2ui-capi tag and source location information
#undef HM_LOG
#undef HM_LOGV
#undef HM_LOGD
#undef HM_LOGI
#undef HM_LOGW
#undef HM_LOGE
#undef HM_LOGF

/**
 * @brief Log output macro
 *
 * Usage:
 *   HM_LOG("Hello %s", "World");
 *   HM_LOGI("Request ID: %u", requestId);
 *
 * Output: [a2ui-capi][functionName@line] log message
 *
 * @param fmt Format string
 * @param ... Variadic arguments
 */
#if defined(APP_BUILD_TYPE_TEST) || defined(APP_BUILD_TYPE_INSPECT) || defined(APP_BUILD_TYPE_ASAN)
    #define HM_LOG(fmt, ...) \
        a2ui_capi_log_format(LOG_DEBUG, __FUNCTION__, __LINE__, fmt, ##__VA_ARGS__)
    
    #define HM_LOGV(fmt, ...) \
        a2ui_capi_log_format(LOG_DEBUG, __FUNCTION__, __LINE__, fmt, ##__VA_ARGS__)
    
    #define HM_LOGD(fmt, ...) \
        a2ui_capi_log_format(LOG_DEBUG, __FUNCTION__, __LINE__, fmt, ##__VA_ARGS__)
    
    #define HM_LOGI(fmt, ...) \
        a2ui_capi_log_format(LOG_INFO, __FUNCTION__, __LINE__, fmt, ##__VA_ARGS__)
    
    #define HM_LOGW(fmt, ...) \
        a2ui_capi_log_format(LOG_WARN, __FUNCTION__, __LINE__, fmt, ##__VA_ARGS__)
    
    #define HM_LOGE(fmt, ...) \
        a2ui_capi_log_format(LOG_ERROR, __FUNCTION__, __LINE__, fmt, ##__VA_ARGS__)
    
    #define HM_LOGF(fmt, ...) \
        a2ui_capi_log_format(LOG_FATAL, __FUNCTION__, __LINE__, fmt, ##__VA_ARGS__)
#else
    #define HM_LOG(fmt, ...)
    #define HM_LOGV(fmt, ...)
    #define HM_LOGD(fmt, ...)
    #define HM_LOGI(fmt, ...)
    #define HM_LOGW(fmt, ...)
    #define HM_LOGE(fmt, ...)
    #define HM_LOGF(fmt, ...)
#endif

// Redefine assertion macros
#undef RELEASE_ASSERT_WITHLOG
#undef RELEASE_ASSERT

/**
 * @brief Assertion macro
 *
 * Usage:
 *   RELEASE_ASSERT(ptr != nullptr);
 *   RELEASE_ASSERT_WITHLOG(result == 0, "Operation failed with code %d", result);
 *
 * Output: [a2ui-capi][filename:line][functionName] assertion failure
 */
#define RELEASE_ASSERT_WITHLOG(expr, format, ...) \
    if(!(expr)) { \
        a2ui_capi_assert_log_format(LOG_FATAL, __FILE__, __FUNCTION__, __LINE__, "Assertion failed: %s " format, #expr, ##__VA_ARGS__); \
        abort(); \
    }

#define RELEASE_ASSERT(expr) \
    if(!(expr)) { \
        a2ui_capi_assert_log_format(LOG_FATAL, __FILE__, __FUNCTION__, __LINE__, "Assertion failed: %s", #expr); \
        abort(); \
    }
