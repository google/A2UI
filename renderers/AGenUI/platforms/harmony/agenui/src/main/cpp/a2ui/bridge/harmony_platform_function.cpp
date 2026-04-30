#if defined(HARMONY) || defined(__HARMONY__) || defined(__OHOS__)
#include "harmony_platform_function.h"
#include "a2ui/a2ui_message_listener.h"
#include "log/a2ui_capi_log.h"
#include <nlohmann/json.hpp>

namespace agenui {

HarmonyPlatformFunction::HarmonyPlatformFunction(napi_env env, napi_value callback,
                                                   napi_threadsafe_function tsfn,
                                                   pthread_t mainThreadId)
    : tsfn_(tsfn), mainThreadId_(mainThreadId) {
    napi_status status = napi_create_reference(env, callback, 1, &callback_ref_);
    if (status != napi_ok) {
        HM_LOGE("[HarmonyPlatformFunction] Failed to create callback reference");
        callback_ref_ = nullptr;
        return;
    }
    env_ = env;
    HM_LOGI("[HarmonyPlatformFunction] created (tsfn=%p)", (void*)tsfn);
}

bool HarmonyPlatformFunction::isValid() const {
    return env_ != nullptr && callback_ref_ != nullptr;
}

HarmonyPlatformFunction::~HarmonyPlatformFunction() {
    std::lock_guard<std::mutex> lock(mutex_);
    if (callback_ref_ != nullptr && env_ != nullptr) {
        napi_delete_reference(env_, callback_ref_);
        callback_ref_ = nullptr;
    }
    env_ = nullptr;
    HM_LOGI("[HarmonyPlatformFunction] destroyed");
}

/**
 * @brief Execute the NAPI callback directly on the main thread.
 *
 * This path is only used after confirming the current thread is the main thread.
 */
FunctionCallResult HarmonyPlatformFunction::callSyncOnMainThread(
    napi_env env, napi_ref callbackRef, const std::string& params) {

    // Get the callback function
    napi_value callback;
    napi_status status = napi_get_reference_value(env, callbackRef, &callback);
    if (status != napi_ok) {
        HM_LOGE("[HarmonyPlatformFunction] callSyncOnMainThread: failed to get callback reference");
        return {FunctionCallStatus::Error, "", "Failed to get callback reference"};
    }

    // Create the callback argument.
    napi_value paramsArg;
    status = napi_create_string_utf8(env, params.c_str(), NAPI_AUTO_LENGTH, &paramsArg);
    if (status != napi_ok) {
        HM_LOGE("[HarmonyPlatformFunction] callSyncOnMainThread: failed to create params string");
        return {FunctionCallStatus::Error, "", "Failed to create params string"};
    }

    napi_value undefined;
    napi_get_undefined(env, &undefined);

    // Invoke the ArkTS callback: callback(paramsJson) => resultJson.
    napi_value result;
    napi_value args[] = {paramsArg};
    status = napi_call_function(env, undefined, callback, 1, args, &result);
    if (status != napi_ok) {
        HM_LOGE("[HarmonyPlatformFunction] callSyncOnMainThread: failed to call callback, status=%d", status);
        return {FunctionCallStatus::Error, "", "Failed to call callback"};
    }

    // Check the return type
    napi_valuetype resultType;
    napi_typeof(env, result, &resultType);
    if (resultType != napi_string) {
        HM_LOGW("[HarmonyPlatformFunction] callSyncOnMainThread: callback returned non-string type");
        return {FunctionCallStatus::Error, "", "Callback returned non-string type"};
    }

    // Read the returned JSON string.
    size_t resultLen = 0;
    napi_get_value_string_utf8(env, result, nullptr, 0, &resultLen);
    char* resultBuf = new char[resultLen + 1];
    napi_get_value_string_utf8(env, result, resultBuf, resultLen + 1, &resultLen);
    std::string resultStr(resultBuf);
    delete[] resultBuf;

    HM_LOGI("[HarmonyPlatformFunction] callSyncOnMainThread: result=%s", resultStr.c_str());

    // Convert the SkillResult JSON into a FunctionCallResult.
    try {
        nlohmann::json jsonObj = nlohmann::json::parse(resultStr);
        std::string statusStr = jsonObj.value("status", "Error");

        if (statusStr == "Success") {
            std::string data;
            if (jsonObj.contains("value")) {
                data = jsonObj["value"].dump();
            }
            return {FunctionCallStatus::Success, data, ""};
        } else {
            std::string error = jsonObj.value("error", "Unknown error");
            return {FunctionCallStatus::Error, "", error};
        }
    } catch (const std::exception& e) {
        HM_LOGE("[HarmonyPlatformFunction] callSyncOnMainThread: JSON parse error: %s", e.what());
        return {FunctionCallStatus::Error, "", std::string("Failed to parse result: ") + e.what()};
    }
}

FunctionCallResult HarmonyPlatformFunction::callSync(const std::string& params) {
    // Snapshot env and callback_ref under lock.
    napi_env env;
    napi_ref callbackRef;
    {
        std::lock_guard<std::mutex> lock(mutex_);
        if (env_ == nullptr || callback_ref_ == nullptr) {
            HM_LOGE("[HarmonyPlatformFunction] callSync: callback not available");
            return {FunctionCallStatus::Error, "", "Callback not available"};
        }
        env = env_;
        callbackRef = callback_ref_;
    }

    // Call directly when already on the main thread.
    if (pthread_equal(pthread_self(), mainThreadId_)) {
        HM_LOGI("[HarmonyPlatformFunction] callSync: on main thread, calling directly");
        return callSyncOnMainThread(env, callbackRef, params);
    }

    // Otherwise dispatch to the main thread and wait synchronously.
    if (tsfn_ == nullptr) {
        HM_LOGE("[HarmonyPlatformFunction] callSync: tsfn not available, cannot dispatch to main thread");
        return {FunctionCallStatus::Error, "", "Thread-safe function not available"};
    }

    HM_LOGI("[HarmonyPlatformFunction] callSync: on worker thread, dispatching to main thread");

    // Stack-allocated cross-thread context guarded by a condition variable.
    struct CrossThreadContext {
        napi_env env;
        napi_ref callbackRef;
        const std::string* params;
        FunctionCallResult result;
        std::mutex mtx;
        std::condition_variable cv;
        bool done = false;
        HarmonyPlatformFunction* self;
    };

    CrossThreadContext ctx;
    ctx.env = env;
    ctx.callbackRef = callbackRef;
    ctx.params = &params;
    ctx.self = this;

    // Heap-allocate the task; the TSFN callback path deletes it.
    auto* task = new MainThreadTask([&ctx](napi_env taskEnv) {
        ctx.result = ctx.self->callSyncOnMainThread(taskEnv, ctx.callbackRef, *ctx.params);
        {
            std::lock_guard<std::mutex> lock(ctx.mtx);
            ctx.done = true;
        }
        ctx.cv.notify_one();
    });

    napi_status status = napi_call_threadsafe_function(tsfn_, task, napi_tsfn_blocking);
    if (status != napi_ok) {
        HM_LOGE("[HarmonyPlatformFunction] callSync: napi_call_threadsafe_function failed, status=%d", status);
        delete task;
        return {FunctionCallStatus::Error, "", "Failed to dispatch to main thread"};
    }

    // Block until the main-thread call completes.
    std::unique_lock<std::mutex> waitLock(ctx.mtx);
    ctx.cv.wait(waitLock, [&ctx] { return ctx.done; });

    HM_LOGI("[HarmonyPlatformFunction] callSync: main thread execution completed");
    return ctx.result;
}

FunctionCallResult HarmonyPlatformFunction::callAsync(const std::string& params,
                                                       const FunctionCallCallback& callback) {
    // Async calls currently fall back to the synchronous path.
    HM_LOGW("[HarmonyPlatformFunction] callAsync: falling back to sync call");
    FunctionCallResult result = callSync(params);
    if (callback) {
        callback(result);
    }
    return result;
}

} // namespace agenui
#endif
