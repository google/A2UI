#pragma once
#ifdef __ANDROID__

#include <jni.h>
#include <string>
#include <mutex>
#include <set>
#include "agenui_platform_function.h"

namespace agenui {

// Tracks active async callback pointers to prevent double-free
extern std::mutex sAsyncCallbacksMutex;
extern std::set<void*> sActiveAsyncCallbacks;

/**
 * @brief Register an async callback pointer into the active set
 * @param ptr callback pointer
 */
void registerAsyncCallback(void* ptr);

/**
 * @brief Consume an async callback pointer (remove from the active set)
 * @param ptr callback pointer
 * @return true if valid and removed, false if invalid or already consumed
 */
bool consumeAsyncCallback(void* ptr);

/**
 * @brief Android platform function implementation
 * @note Wraps a Java object that implements platform function calls via JNI
 */
class AndroidPlatformFunction : public IPlatformFunction {
public:
    /**
     * @brief Construct with Java function object
     * @param env JNI environment (must be valid)
     * @param javaFunction Java object implementing the function (local ref, will be converted to global ref)
     */
    AndroidPlatformFunction(JNIEnv* env, jobject javaFunction);
    ~AndroidPlatformFunction() override;

    FunctionCallResult callSync(const std::string& params) override;
    FunctionCallResult callAsync(const std::string& params,
                                 const FunctionCallCallback& callback) override;

private:
    JavaVM* _jvm = nullptr;
    jobject _javaFunction = nullptr;    // GlobalRef
    jmethodID _callSyncMethod = nullptr;
    jmethodID _callAsyncMethod = nullptr;
};

} // namespace agenui

#endif // __ANDROID__
