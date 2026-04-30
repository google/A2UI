#include "agenui_logger.h"

#define LOG_SIZE (4 * 1024)
#define LOG_SIZE_DEBUG (1024 * 1024)

#if defined(__OHOS__)
    #include <hilog/log.h>
    #undef LOG_DOMAIN
    #undef LOG_TAG
    #define LOG_DOMAIN 0x0000
#elif defined(__ANDROID__)
    #include <android/log.h>
#elif defined(__APPLE__)
    #include <cstdio>
    #include <sys/time.h>
    #include <time.h>
#else
    #include <cstdio>
#endif


namespace agenui {
static class DefultLogImpl : public ILogger {
public:
    DefultLogImpl() = default;
    ~DefultLogImpl() = default;

public:
    void log(LogLevel level, const char* tag, const char* func, int line, const char* format, ...) override;

private:
    void logImpl(LogLevel level, const char* tag, const char *func, int line, const char* message);

} gDefaultLogger;

ILogger* gLogger = &gDefaultLogger;

#if defined(__APPLE__)
/**
 * @brief Returns a formatted timestamp string (iOS platform).
 * @return Formatted timestamp in [YYYY-MM-DD HH:MM:SS.mmm] format
 */
inline const char* getFormattedTimestamp() {
    static __thread char buffer[32];
    struct timeval tv;
    gettimeofday(&tv, nullptr);

    struct tm timeInfo;
    localtime_r(&tv.tv_sec, &timeInfo);

    int milliseconds = tv.tv_usec / 1000;
    snprintf(buffer, sizeof(buffer), "[%04d-%02d-%02d %02d:%02d:%02d.%03d]",
             timeInfo.tm_year + 1900, timeInfo.tm_mon + 1, timeInfo.tm_mday,
             timeInfo.tm_hour, timeInfo.tm_min, timeInfo.tm_sec, milliseconds);

    return buffer;
}
#endif

inline void vaListToString(const char* format, va_list st, std::string& strVaList) {
    char tmpSrc[LOG_SIZE];
    tmpSrc[0] = 0;
    vsnprintf(tmpSrc, LOG_SIZE, format, st);
    tmpSrc[LOG_SIZE - 1] = 0;
    strVaList = std::string(tmpSrc);
}

inline void vaListToStringBigData(const char* format, va_list st, std::string& strVaList) {
    va_list argcopy;
    va_copy(argcopy, st);
    int len = vsnprintf(NULL, 0, format, argcopy) + 1;
    va_end(argcopy);

    if (len > LOG_SIZE) {
        if (len > LOG_SIZE_DEBUG) {
            len = LOG_SIZE_DEBUG;
        }
        char* tmpSrc = new char[len];
        tmpSrc[0] = 0;
        vsnprintf(tmpSrc, len, format, st);
        tmpSrc[len - 1] = 0;
        strVaList = tmpSrc;
        delete[] tmpSrc;
    } else {
        vaListToString(format, st, strVaList);
    }
}

void DefultLogImpl::log(LogLevel level, const char *tag, const char *func, int line, const char *format, ...) {
    va_list args;
    va_start(args, format);
    std::string strVaList;
    if (level == LOG_LEVEL_DEBUG) {
        vaListToStringBigData(format, args, strVaList);
    } else {
        vaListToString(format, args, strVaList);
    }
    va_end(args);

    logImpl(level, tag ? tag : "", func ? func : "", line, strVaList.c_str());
}

void DefultLogImpl::logImpl(LogLevel level, const char* tag, const char *func, int line, const char* message) {
#if defined(__OHOS__)
    // HarmonyOS: use OH_LOG_Print
    OH_LOG_Print(LOG_APP, LOG_DEBUG, 0x0, tag, "[%{public}s@%{public}d] %{public}s", func, line, message);
#elif defined(__ANDROID__)
    // Android: use __android_log_print
    __android_log_print(ANDROID_LOG_DEBUG, tag, "[%s@%d] %s", func, line, message);
#elif defined(__APPLE__)
    // iOS: use printf with timestamp
    printf("%s[%s][%s@%d] %s\n", getFormattedTimestamp(), tag, func, line, message);
#else
    // Other platforms: use printf
    printf("[%s][%s@%d] %s\n", tag, func, line, message);
#endif
}

}
