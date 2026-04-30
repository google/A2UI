#pragma once

#include "napi/native_api.h"
#include <string>
#include <mutex>

namespace a2ui {

/**
 * Singleton helper for opening URLs through an ArkTS callback.
 *
 * Workflow:
 *   1. ArkTS calls registerOpenUrlCallback(callback) to register the JS callback.
 *   2. C++ code, such as RichTextComponent link handling, calls OpenUrlHelper::openUrl(url).
 *   3. The helper invokes the registered callback through NAPI so ArkTS can open the browser.
 */
class OpenUrlHelper {
public:
    static OpenUrlHelper& getInstance();

    /**
     * Register the ArkTS openUrl callback.
     * @param env NAPI environment
     * @param callback ArkTS callback with signature (url: string) => void
     */
    void registerCallback(napi_env env, napi_value callback);

    /**
     * Invoke the registered callback to open a URL.
     * @param url URL to open
     */
    void openUrl(const std::string& url);

    /**
     * Clear the callback reference.
     */
    void clear();

private:
    OpenUrlHelper() = default;
    ~OpenUrlHelper();

    OpenUrlHelper(const OpenUrlHelper&) = delete;
    OpenUrlHelper& operator=(const OpenUrlHelper&) = delete;

    napi_env env_ = nullptr;
    napi_ref callback_ref_ = nullptr;
    std::mutex mutex_;
};

} // namespace a2ui
