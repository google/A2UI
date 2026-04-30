#pragma once

#if defined(HARMONY) || defined(__HARMONY__) || defined(__OHOS__)
#include "agenui_platform_function.h"
#include "napi/native_api.h"
#include <string>
#include <mutex>
#include <condition_variable>
#include <pthread.h>

namespace agenui {

/**
 * @brief Harmony implementation of IPlatformFunction.
 *
 * Each skill owns one instance. The function stores a NAPI callback reference and
 * dispatches engine requests back to ArkTS.
 *
 * Threading:
 *   - callSync may run on a worker thread
 *   - NAPI calls must run on the main thread
 *   - napi_threadsafe_function is used to hop to the main thread and wait for the result
 *
 * Lifecycle:
 *   - the constructor creates the napi_ref for the callback
 *   - unregisterFunction must be called before destruction to avoid stale pointers
 *   - the destructor releases the napi_ref
 */
class HarmonyPlatformFunction : public IPlatformFunction {
public:
    /**
     * @brief Constructor
     * @param env NAPI environment on the main thread
     * @param callback ArkTS callback with signature (paramsJson: string) => string
     * @param tsfn Main-thread threadsafe function used to dispatch NAPI work
     * @param mainThreadId Main thread ID used for thread checks
     */
    HarmonyPlatformFunction(napi_env env, napi_value callback,
                            napi_threadsafe_function tsfn, pthread_t mainThreadId);

    ~HarmonyPlatformFunction() override;

    /**
     * @brief Return whether the callback reference was created successfully.
     */
    bool isValid() const;

    /**
     * @brief Synchronous, thread-safe invocation.
     * @param params Parameter JSON string
     * @return Function result
     */
    FunctionCallResult callSync(const std::string& params) override;

    /**
     * @brief Asynchronous invocation.
     * @param params Parameter JSON string
     * @param callback Completion callback
     * @return Function result, typically a pending state
     */
    FunctionCallResult callAsync(const std::string& params,
                                  const FunctionCallCallback& callback) override;

private:
    /**
     * @brief Execute the NAPI callback directly on the main thread.
     */
    FunctionCallResult callSyncOnMainThread(napi_env env, napi_ref callbackRef,
                                             const std::string& params);

    napi_env env_ = nullptr;
    napi_ref callback_ref_ = nullptr;
    napi_threadsafe_function tsfn_ = nullptr;
    pthread_t mainThreadId_ = 0;
    std::mutex mutex_;
};

} // namespace agenui
#endif
