#pragma once

#include "agenui_engine.h"
#include "agenui_engine_context.h"
#include <map>
#include <memory>
#include <atomic>

namespace agenui {

class SurfaceManager;
class FunctionCallManager;
class IComponentPropertySpecManager;

/**
 * @brief AGenUI engine implementation
 *
 * Global singleton engine responsible for:
 * 1. Managing singleton modules (FunctionCallManager)
 * 2. Creating and destroying SurfaceManager instances
 * 3. Managing global configuration (theme, DesignToken, day/night mode)
 */
class AGenUIEngine : public IAGenUIEngine, public IEngineContext {
public:
    AGenUIEngine();
    ~AGenUIEngine();

    /**
     * @brief Starts the engine and initializes all singleton modules.
     * @note Called by initAGenUIEngine(); not exposed publicly
     */
    void start();

    /**
     * @brief Stops the engine and destroys all modules.
     * @note Called by destroyAGenUIEngine() and the destructor; not exposed publicly
     */
    void stop();

    ISurfaceManager* createSurfaceManager() override;
    void destroySurfaceManager(ISurfaceManager* surfaceManager) override;
    ISurfaceManager* findSurfaceManager(int engineId) override;

    void setWorkingDir(const std::string &dir) override;
    void setPlatformLayoutBridge(IPlatformLayoutBridge* platformLayoutBridge) override;
    IPlatformLayoutBridge* getPlatformLayoutBridge() override;

    bool registerFunction(const std::string& config, IPlatformFunction* function) override;
    bool unregisterFunction(const std::string& name) override;
    bool loadThemeConfig(const std::string &themeConfig, std::string &result) override;
    bool loadDesignTokenConfig(const std::string &designTokenConfig, std::string &result) override;
    void setDayNightMode(const std::string &mode) override;

    FunctionCallManager* getFunctionCallManager() override { return _functionCallManager; }
    IComponentPropertySpecManager* getComponentPropertySpecManager() override { return _componentPropertySpecManager; }
    const std::string& getWorkingDir() const override { return _workingDir; }

private:
    std::atomic_bool _isRunning{false};
    // Single-instance modules (owned)
    FunctionCallManager* _functionCallManager = nullptr;
    IComponentPropertySpecManager* _componentPropertySpecManager = nullptr;

    // Single-instance external dependency (not owned)
    IPlatformLayoutBridge* _platformLayoutBridge = nullptr;

    // Working directory
    std::string _workingDir;

    // Multi-instance SurfaceManager map
    std::map<int32_t, std::shared_ptr<SurfaceManager>> _surfaceManagers;
    std::atomic<int32_t> _nextEngineId{1};
};

} // namespace agenui
