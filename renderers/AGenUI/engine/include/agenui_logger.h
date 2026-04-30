#pragma once
#include <string>

namespace agenui {
enum LogLevel {
    LOG_LEVEL_DEBUG,
    LOG_LEVEL_INFO,
    LOG_LEVEL_WARN,
    LOG_LEVEL_ERROR,
    LOG_LEVEL_FATAL,
};

class ILogger {
protected:
    virtual ~ILogger() = default;

public:
    virtual void log(LogLevel level, const char* tag, const char* func, int line, const char* format, ...) = 0;
};

} // namespace agenui
