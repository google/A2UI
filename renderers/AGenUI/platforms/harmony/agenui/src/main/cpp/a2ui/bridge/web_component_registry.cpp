#include "web_component_registry.h"
#include "../render/a2ui_node.h"
#include "arkui/native_node_napi.h"
#include "log/a2ui_capi_log.h"

namespace a2ui {

WebComponentRegistry& WebComponentRegistry::getInstance() {
    static WebComponentRegistry instance;
    return instance;
}

WebComponentRegistry::~WebComponentRegistry() {
    clear();
}

void WebComponentRegistry::registerCallback(napi_env env, napi_ref showRef, napi_ref destroyRef) {
    std::lock_guard<std::mutex> lock(m_mutex);

    // Clear the previous callback reference
    if (m_showRef != nullptr && m_env != nullptr) {
        napi_delete_reference(m_env, m_showRef);
        m_showRef = nullptr;
    }
    if (m_destroyRef != nullptr && m_env != nullptr) {
        napi_delete_reference(m_env, m_destroyRef);
        m_destroyRef = nullptr;
    }

    m_env = env;
    m_showRef = showRef;
    m_destroyRef = destroyRef;

    HM_LOGI("WebComponentRegistry: Callbacks registered successfully");
}

void WebComponentRegistry::notifyShow(const std::string& componentId, const std::string& source,
                                       bool isUrl, uintptr_t containerHandle) {
    napi_env env = nullptr;
    napi_value showCallback = nullptr;

    // Use unique_lock so the mutex can be released before calling JS and avoid deadlocks.
    // napi_call_function synchronously invokes ArkTS, which may re-enter attachWebFrameNode.
    {
        std::unique_lock<std::mutex> lock(m_mutex);

        if (m_env == nullptr || m_showRef == nullptr) {
            HM_LOGE("No callback registered, id=%s", componentId.c_str());
            return;
        }

        // Cache containerHandle for attachFrameNode while the mutex is held.
        m_containerHandleMap[componentId] = containerHandle;

        env = m_env;

        // Resolve showCallback under the lock because another thread may delete the ref.
        napi_status status = napi_get_reference_value(env, m_showRef, &showCallback);
        if (status != napi_ok || showCallback == nullptr) {
            HM_LOGE("Failed to get showRef value");
            return;
        }
    } // Release the lock before invoking JS.

    // Build arguments: (componentId: string, source: string, isUrl: boolean).
    napi_value args[3];
    napi_create_string_utf8(env, componentId.c_str(), NAPI_AUTO_LENGTH, &args[0]);
    napi_create_string_utf8(env, source.c_str(), NAPI_AUTO_LENGTH, &args[1]);
    napi_get_boolean(env, isUrl, &args[2]);

    // Invoke the ArkTS callback without holding the mutex.
    napi_value undefined, result;
    napi_get_undefined(env, &undefined);
    napi_status status = napi_call_function(env, undefined, showCallback, 3, args, &result);
    if (status != napi_ok) {
        HM_LOGE("Failed to call showCallback, id=%s", componentId.c_str());
        return;
    }

    HM_LOGI("Called showCallback: id=%s, isUrl=%d", componentId.c_str(), isUrl);
}

void WebComponentRegistry::notifyDestroy(const std::string& componentId) {
    napi_env env = nullptr;
    napi_value destroyCallback = nullptr;

    {
        std::unique_lock<std::mutex> lock(m_mutex);

        // Remove the cached handle.
        m_containerHandleMap.erase(componentId);

        if (m_env == nullptr || m_destroyRef == nullptr) {
            HM_LOGW("No destroyCallback, id=%s", componentId.c_str());
            return;
        }

        env = m_env;

        napi_status status = napi_get_reference_value(env, m_destroyRef, &destroyCallback);
        if (status != napi_ok || destroyCallback == nullptr) {
            HM_LOGE("Failed to get destroyRef value");
            return;
        }
    } // Release the lock before invoking JS.

    // Arguments: (componentId: string).
    napi_value args[1];
    napi_create_string_utf8(env, componentId.c_str(), NAPI_AUTO_LENGTH, &args[0]);

    napi_value undefined, result;
    napi_get_undefined(env, &undefined);
    napi_status status = napi_call_function(env, undefined, destroyCallback, 1, args, &result);
    if (status != napi_ok) {
        HM_LOGE("Failed to call destroyCallback, id=%s", componentId.c_str());
        return;
    }

    HM_LOGI("Called destroyCallback: id=%s", componentId.c_str());
}

bool WebComponentRegistry::attachFrameNode(napi_env env, const std::string& componentId,
                                            napi_value frameNodeNapi) {
    std::lock_guard<std::mutex> lock(m_mutex);

    // Look up the cached container handle.
    auto it = m_containerHandleMap.find(componentId);
    if (it == m_containerHandleMap.end()) {
        HM_LOGE("No containerHandle for id=%s", componentId.c_str());
        return false;
    }

    ArkUI_NodeHandle containerHandle = reinterpret_cast<ArkUI_NodeHandle>(it->second);

    // Convert the ArkTS FrameNode to a C++ ArkUI_NodeHandle.
    ArkUI_NodeHandle frameNodeHandle = nullptr;
    int32_t ret = OH_ArkUI_GetNodeHandleFromNapiValue(env, frameNodeNapi, &frameNodeHandle);
    if (ret != 0 || frameNodeHandle == nullptr) {
        HM_LOGE("OH_ArkUI_GetNodeHandleFromNapiValue failed, ret=%d, id=%s", ret, componentId.c_str());
        return false;
    }

    // Mount the Web FrameNode under the STACK container.
    g_nodeAPI->addChild(containerHandle, frameNodeHandle);

    HM_LOGI("Web FrameNode attached to STACK: id=%s", componentId.c_str());
    return true;
}

void WebComponentRegistry::clear() {
    std::lock_guard<std::mutex> lock(m_mutex);

    if (m_showRef != nullptr && m_env != nullptr) {
        napi_delete_reference(m_env, m_showRef);
        m_showRef = nullptr;
    }
    if (m_destroyRef != nullptr && m_env != nullptr) {
        napi_delete_reference(m_env, m_destroyRef);
        m_destroyRef = nullptr;
    }

    m_env = nullptr;
    m_containerHandleMap.clear();

    HM_LOGI("WebComponentRegistry: cleared");
}

} // namespace a2ui
