#pragma once

#include <string>

namespace agenui {

class FunctionCallManager;
class IPlatformLayoutBridge;
class IComponentPropertySpecManager;

/**
 * @brief Engine context interface
 *
 * Defines read-only access to engine-level shared services.
 * Implemented by AGenUIEngine; retrieved via the global accessor getEngineContext().
 *
 * Design goals:
 * - Dependency inversion: lower-level modules (a2ui) depend on this interface, not on AGenUIEngine
 * - Interface segregation: exposes only the minimal getter set required by lower-level modules
 * - Single source of truth: all data comes from the engine instance, with no copies
 */
class IEngineContext {
public:
    virtual ~IEngineContext() = default;

    virtual FunctionCallManager* getFunctionCallManager() = 0;
    virtual IComponentPropertySpecManager* getComponentPropertySpecManager() = 0;
    virtual IPlatformLayoutBridge* getPlatformLayoutBridge() = 0;
    virtual const std::string& getWorkingDir() const = 0;
};

/**
 * @brief Returns the current engine context (global access point).
 *
 * Available after engine start(); returns nullptr after stop().
 * Other modules use this to access engine-level shared services without depending on AGenUIEngine.
 *
 * @return Engine context pointer, or nullptr if the engine is not running
 */
IEngineContext* getEngineContext();

/**
 * @brief Sets the engine context (for internal use by AGenUIEngine only).
 * @param ctx Engine context pointer; pass nullptr to unregister
 */
void setEngineContext(IEngineContext* ctx);

} // namespace agenui
