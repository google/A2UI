#pragma once
#include <string>

namespace agenui {

class ISurfaceManager;
class IPlatformLayoutBridge;
class IPlatformInvoker;
class IPlatformFunction;

/**
 * @brief AGenUI Engine Interface
 *
 * The globally unique engine instance, responsible for:
 * 1. Managing singleton modules (FunctionCallManager, TokenParser, etc.)
 * 2. Creating and destroying multi-instance SurfaceManagers
 * 3. Managing global configurations (theme, DesignToken, day/night mode)
 *
 * Thread convention: All external interfaces are called on the main thread
 */
class IAGenUIEngine {
public:
    virtual ~IAGenUIEngine() = default;
    /**
     * @brief Creates a SurfaceManager instance
     * @return SurfaceManager interface pointer
     */
    virtual ISurfaceManager* createSurfaceManager() = 0;

    /**
     * @brief Destroys a SurfaceManager instance
     * @param surfaceManager The SurfaceManager pointer to destroy
     */
    virtual void destroySurfaceManager(ISurfaceManager* surfaceManager) = 0;

    /**
     * @brief Finds a SurfaceManager by engineId
     * @param engineId The unique ID assigned at creation
     * @return SurfaceManager interface pointer, nullptr if not found
     */
    virtual ISurfaceManager* findSurfaceManager(int engineId) = 0;

    /**
     * @brief Sets the working directory for debugging info
     * @param dir Working directory path
     */
    virtual void setWorkingDir(const std::string &dir) = 0;

    /**
     * @brief Sets the platform layout bridge service (singleton)
     * @param platformLayoutBridge Platform layout bridge interface pointer
     */
    virtual void setPlatformLayoutBridge(IPlatformLayoutBridge* platformLayoutBridge) = 0;

    /**
     * @brief Gets the platform layout bridge service
     * @return Platform layout bridge interface pointer, nullptr if not set
     */
    virtual IPlatformLayoutBridge* getPlatformLayoutBridge() = 0;

    /**
     * @brief Registers a platform function
     * @param config Function configuration in JSON format
     * @param function Platform function implementation pointer, must not be null
     * @return true if registration succeeds, false otherwise
     * @note Ownership convention: When registration succeeds, the caller must ensure the function
     *       remains valid until unregisterFunction is called. When registration fails, ownership
     *       remains with the caller, who is responsible for releasing it.
     */
    virtual bool registerFunction(const std::string& config, IPlatformFunction* function) = 0;

    /**
     * @brief Unregisters a platform function
     * @param name Function name
     * @return true if unregistration succeeds, false if not found or engine not ready
     */
    virtual bool unregisterFunction(const std::string& name) = 0;

    /**
     * @brief Loads the theme configuration file
     * @param themeConfig Theme configuration content in JSON format
     * @param[out] result Error content when function execution fails
     * @return Execution result, true for success, false for failure
     */
    virtual bool loadThemeConfig(const std::string &themeConfig, std::string &result) = 0;

    /**
     * @brief Loads the DesignToken configuration file
     * @param designTokenConfig DesignToken configuration content in JSON format
     * @param[out] result Error content when function execution fails
     * @return Execution result, true for success, false for failure
     */
    virtual bool loadDesignTokenConfig(const std::string &designTokenConfig, std::string &result) = 0;

    /**
     * @brief Sets the day/night mode
     * @param mode Mode configuration, "light" or "dark"
     */
    virtual void setDayNightMode(const std::string &mode) = 0;

};

} // namespace agenui
