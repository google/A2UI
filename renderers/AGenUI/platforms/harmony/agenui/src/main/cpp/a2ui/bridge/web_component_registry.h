#pragma once

#include "napi/native_api.h"
#include <string>
#include <map>
#include <mutex>

namespace a2ui {

/**
 * Singleton bridge between C++ WebComponent and ArkTS BuilderNode<Web>.
 *
 * Workflow:
 *   1. ArkTS calls registerWebCallback(showCb, destroyCb) to register the callbacks.
 *   2. C++ WebComponent calls notifyShow() during onUpdateProperties to request Web node creation
 *      and caches the STACK handle in m_containerHandleMap.
 *   3. After ArkTS creates the BuilderNode, it calls attachFrameNode() to mount the FrameNode.
 *   4. C++ WebComponent calls notifyDestroy() during teardown so ArkTS can release the BuilderNode.
 */
class WebComponentRegistry {
public:
    static WebComponentRegistry& getInstance();

    /**
     * Register the ArkTS callbacks.
     * @param env NAPI environment
     * @param showRef napi_ref for showCallback, used when ArkTS creates or updates a Web node
     * @param destroyRef napi_ref for destroyCallback, used when ArkTS destroys the BuilderNode
     */
    void registerCallback(napi_env env, napi_ref showRef, napi_ref destroyRef);

    /**
     * Notify ArkTS to create and mount a Web node.
     * @param componentId Unique component ID
     * @param source URL or HTML content
     * @param isUrl Whether source is a URL
     * @param containerHandle STACK handle stored as uintptr_t to avoid header dependencies
     */
    void notifyShow(const std::string& componentId, const std::string& source,
                    bool isUrl, uintptr_t containerHandle);

    /**
     * Notify ArkTS to destroy the matching BuilderNode.
     * @param componentId Unique component ID
     */
    void notifyDestroy(const std::string& componentId);

    /**
     * Mount a BuilderNode FrameNode under the matching STACK node.
     * @param env NAPI environment
     * @param componentId Unique component ID
     * @param frameNodeNapi FrameNode returned by ArkTS BuilderNode.getFrameNode()
     * @return True if mounting succeeds
     */
    bool attachFrameNode(napi_env env, const std::string& componentId, napi_value frameNodeNapi);

    /**
     * Clear all callback references.
     */
    void clear();

private:
    WebComponentRegistry() = default;
    ~WebComponentRegistry();
    WebComponentRegistry(const WebComponentRegistry&) = delete;
    WebComponentRegistry& operator=(const WebComponentRegistry&) = delete;

    napi_env m_env = nullptr;
    napi_ref m_showRef = nullptr;
    napi_ref m_destroyRef = nullptr;

    // componentId -> STACK ArkUI_NodeHandle stored as uintptr_t
    std::map<std::string, uintptr_t> m_containerHandleMap;

    std::mutex m_mutex;
};

} // namespace a2ui
