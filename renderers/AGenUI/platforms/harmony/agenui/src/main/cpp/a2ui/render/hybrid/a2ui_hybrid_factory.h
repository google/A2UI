#pragma once

#include <string>
#include <set>
#include <vector>
#include "napi/native_api.h"
#include <nlohmann/json.hpp>

namespace a2ui {

class A2UIHybridView;
class ComponentState;
class UpdateState;

/**
 * A2UIHybridFactory manages hybrid view creation, updates, and teardown.
 *
 * It also bridges ArkTS interaction and attribute observers.
 */
class A2UIHybridFactory {
public:
    /**
     * Create a hybrid view.
     * @param state Component state
     * @return Hybrid view instance
     */
    static A2UIHybridView* createHybridView(ComponentState* state);
    
    /**
     * Update a hybrid view.
     * @param hybridView Hybrid view instance
     * @param updateStates Update state list
     */
    static void updateHybridView(A2UIHybridView* hybridView, const std::vector<UpdateState>& updateStates);
    
    /**
     * Destroy the hybrid view
     * @param hybridView Hybrid view instance
     */
    static void destroyHybridView(A2UIHybridView* hybridView);
    
    /**
     * Invoke a method on the hybrid view.
     */
    static void onInvokeHybridView(A2UIHybridView* hybridView, const std::string& key, const nlohmann::json& params);

    /**
     * Return whether the component type has been registered as a custom ArkTS component.
     * @param componentType Component type
     * @return True when registered
     */
    static bool hasCustomComponent(const std::string& componentType);
    
    /**
     * Add an attribute change observer.
     */
    static napi_value addAttributeChangeObserver(napi_env env, napi_callback_info info);
    
    /**
     * Remove an attribute change observer.
     */
    static napi_value removeAttributeChangeObserver(napi_env env, napi_callback_info info);
    
    /**
     * Set an attribute from ArkTS.
     */
    static napi_value setAttribute(napi_env env, napi_callback_info info);
    
    /**
     * Get an attribute from ArkTS.
     */
    static napi_value getAttribute(napi_env env, napi_callback_info info);
    
    /**
     * Set the engine workspace path.
     */
    static void setEngineWorkspace(const std::string& workspace);
    
    /**
     * Return the engine workspace path.
     */
    static std::string getEngineWorkspace();
    
    /**
     * Set the Haps files path.
     */
    static void setHapsFilesPath(const std::string& path);
    
    /**
     * Return the Haps files path.
     */
    static std::string getHapsFilesPath();
    
    /**
     * Set the resource manager.
     */
    static void setResourceManager(napi_env env, napi_value resourceManager);
    
    /**
     * Register a hybrid view type.
     */
    static void registerHybridView(
        const std::string& tagName,
        napi_value createFunction,
        napi_value updateFunction
    );

private:
    // Engine workspace path
    static std::string s_engineWorkspace;
    
    // Haps files path
    static std::string s_hapsFilesPath;
};

} // namespace a2ui
