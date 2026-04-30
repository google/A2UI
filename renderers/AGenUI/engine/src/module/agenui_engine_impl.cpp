#include "agenui_engine_impl.h"
#include "agenui_log.h"
#include "agenui_type_define.h"
#include "agenui_surface_manager.h"
#include "function_call/agenui_functioncall_manager.h"
#include "function_call/agenui_functioncall_config.h"
#include "agenui_platform_function.h"
#include "surface/agenui_surface_coordinator.h"
#include "agenui_thread_manager.h"
#include "surface/token_parser/agenui_token_parser.h"
#include "surface/component_property_spec/agenui_component_property_spec_manager.h"

namespace agenui {

AGenUIEngine::AGenUIEngine() {
}

AGenUIEngine::~AGenUIEngine() {
    stop();
}

void AGenUIEngine::start() {
    if (_isRunning.load()) {
        return;
    }
    _functionCallManager = new FunctionCallManager();
    _componentPropertySpecManager = new ComponentPropertySpecManager();

    // Create shared worker thread
    ThreadManager::getInstance().createThread(AGENUI_SHARED_THREAD_ID);

    // Register engine context for global access
    setEngineContext(this);
    _isRunning.store(true);
    AGENUI_LOG("AGenUIEngine started successfully");
}

void AGenUIEngine::stop() {
    if (!_isRunning.load()) {
        return;
    }
    _isRunning.store(false);
    // Destroy the shared worker thread first to ensure:
    // 1. All object instances remain valid while the thread is running
    // 2. No thread is running when objects are destroyed
    ThreadManager::getInstance().destroyThread(AGENUI_SHARED_THREAD_ID);
    // Destroy all SurfaceManagers first
    for (auto& pair : _surfaceManagers) {
        pair.second->uninit();
    }
    _surfaceManagers.clear();

    // Clear engine context before destroying modules
    setEngineContext(nullptr);

    // Destroy single-instance modules in reverse order
    SAFELY_DELETE(_componentPropertySpecManager);

    SAFELY_DELETE(_functionCallManager);

    AGENUI_LOG("AGenUIEngine stopped");
}

ISurfaceManager* AGenUIEngine::createSurfaceManager() {
    if (!_isRunning.load()) {
        return nullptr;
    }
    int engineId = _nextEngineId.fetch_add(1);
    auto sm = std::make_shared<SurfaceManager>(engineId);
    sm->enterRunning();
    _surfaceManagers[engineId] = sm;

    IThread* messageThread = ThreadManager::getInstance().getMessageThread(AGENUI_SHARED_THREAD_ID);
    if (!messageThread) {
        return nullptr;
    }
    messageThread->post([sm]() {
        sm->init();
    });

    AGENUI_LOG("Created SurfaceManager with engineId=%d", engineId);
    return sm.get();
}

void AGenUIEngine::destroySurfaceManager(ISurfaceManager* surfaceManager) {
    if (!_isRunning.load()) {
        return;
    }
    auto* sm = static_cast<SurfaceManager*>(surfaceManager);
    for (auto it = _surfaceManagers.begin(); it != _surfaceManagers.end(); ++it) {
        if (it->second.get() == sm) {
            auto shared = it->second;
            int engineId = it->first;
            shared->exitRunning();
            _surfaceManagers.erase(it);
            IThread* messageThread = ThreadManager::getInstance().getMessageThread(AGENUI_SHARED_THREAD_ID);
            if (!messageThread) {
                return;
            }
            messageThread->post([shared]() {
                shared->uninit();
            });
            AGENUI_LOG("Destroying SurfaceManager with engineId=%d", engineId);
            return;
        }
    }

    AGENUI_LOG("SurfaceManager not found for destruction");
}

void AGenUIEngine::setWorkingDir(const std::string &dir) {
    _workingDir = dir;
}

void AGenUIEngine::setPlatformLayoutBridge(IPlatformLayoutBridge* platformLayoutBridge) {
    if (!_isRunning.load()) {
        return;
    }
    _platformLayoutBridge = platformLayoutBridge;
}

IPlatformLayoutBridge* AGenUIEngine::getPlatformLayoutBridge() {
    return _platformLayoutBridge;
}

bool AGenUIEngine::registerFunction(const std::string& config, IPlatformFunction* function) {
    if (!_isRunning.load()) {
        AGENUI_LOG("registerFunction failed: engine is not running");
        return false;
    }
    if (!_functionCallManager) {
        AGENUI_LOG("registerFunction failed: FunctionCallManager not initialized");
        return false;
    }
    if (!function) {
        AGENUI_LOG("registerFunction failed: function is null");
        return false;
    }
    nlohmann::json configJson = nlohmann::json::parse(config, nullptr, false);
    if (configJson.is_discarded()) {
        AGENUI_LOG("registerFunction failed: invalid JSON config");
        return false;
    }
    FunctionCallConfig functionCallConfig = FunctionCallConfig::fromJson(configJson);
    if (functionCallConfig.getName().empty()) {
        AGENUI_LOG("registerFunction failed: missing function name in config");
        return false;
    }
    return _functionCallManager->registerFunctionCall(functionCallConfig, function);
}

bool AGenUIEngine::unregisterFunction(const std::string& name) {
    if (!_isRunning.load()) {
        AGENUI_LOG("unregisterFunction failed: engine is not running");
        return false;
    }
    if (!_functionCallManager) {
        AGENUI_LOG("unregisterFunction failed: FunctionCallManager not initialized");
        return false;
    }
    return _functionCallManager->unregisterFunctionCall(name);
}

bool AGenUIEngine::loadThemeConfig(const std::string &themeConfig, std::string &result) {
    if (!_isRunning.load()) {
        return false;
    }
    if (!_componentPropertySpecManager) {
        result = "ComponentPropertySpecManager not initialized";
        return false;
    }
    bool success = _componentPropertySpecManager->loadFromString(themeConfig);
    if (!success) {
        result = "Failed to parse theme config";
    }
    return success;
}

bool AGenUIEngine::loadDesignTokenConfig(const std::string &designTokenConfig, std::string &result) {
    if (!_isRunning.load()) {
        return false;
    }
    bool success = TokenParser::getInstance().loadFromJsonString(designTokenConfig);
    if (!success) {
        result = "Failed to parse design token config";
    }
    return success;
}

void AGenUIEngine::setDayNightMode(const std::string &mode) {
    if (!_isRunning.load()) {
        return;
    }
    ThemeMode themeMode = ThemeMode::Light;
    if (mode == "dark") {
        themeMode = ThemeMode::Dark;
    } else if (mode == "light") {
        themeMode = ThemeMode::Light;
    } else {
        AGENUI_LOG("invalid mode '%s', using Light mode as default", mode.c_str());
    }
    if (TokenParser::getInstance().getThemeMode() == themeMode) {
        AGENUI_LOG("skip set theme mode for same mode. %s", mode.c_str());
        return;
    }
    TokenParser::getInstance().setThemeMode(themeMode);
    AGENUI_LOG("theme mode set to %s", mode.c_str());

    for (auto& pair : _surfaceManagers) {
        pair.second->setDayNightMode();
    }
}

ISurfaceManager* AGenUIEngine::findSurfaceManager(int engineId) {
    if (!_isRunning.load()) {
        return nullptr;
    }
    auto it = _surfaceManagers.find(engineId);
    if (it != _surfaceManagers.end()) {
        return it->second.get();
    }
    return nullptr;
}

} // namespace agenui
