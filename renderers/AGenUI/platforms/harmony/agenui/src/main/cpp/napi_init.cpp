#include "a2ui/render/a2ui_component_types.h"
#include "napi/native_api.h"
#include "a2ui/a2ui_message_listener.h"
#include "a2ui/bridge/open_url_helper.h"
#include "a2ui/bridge/skill_invoker_helper.h"
#include "a2ui/bridge/image_loader_bridge.h"
#include "a2ui/bridge/harmony_platform_function.h"
#include "a2ui/render/a2ui_surface.h"
#include "a2ui/render/a2ui_component.h"
#include "a2ui/measure/a2ui_platform_layout_bridge.h"
#include "agenui_engine_entry.h"
#include "agenui_surface_manager_interface.h"
#include "a2ui/render/a2ui_component_state.h"
#include "a2ui/a2ui_component_render_observable.h"
#include "a2ui/a2ui_surface_layout_observable.h"
#include <nlohmann/json.hpp>
#include "a2ui/utils/a2ui_unit_utils.h"
#include "log/a2ui_capi_log.h"
#include "a2ui_api.h"

#undef LOG_DOMAIN
#undef LOG_TAG
#define LOG_DOMAIN 0x0000
#define LOG_TAG "AGenUI_NAPI"

#include <pthread.h>
#include <map>
#include <mutex>

namespace a2ui {

static std::map<std::string, EtsFunction> g_ets_functions_table;
static std::mutex g_ets_functions_mutex;

class HarmonyNAPI : public IHarmonyNAPI {
public:
	virtual ArkTSObject ref(const std::string& name) override {
        std::lock_guard<std::mutex> lock(g_ets_functions_mutex);
        auto i = g_ets_functions_table.find(name);
        if (i != g_ets_functions_table.end()) {
            return ArkTSObject { i->second.env, i->second.ref };
        }
        return ArkTSObject { nullptr, nullptr };
    }
};

static HarmonyNAPI g_harmony_napi;

IHarmonyNAPI* implHarmonyNAPI() {
    return &g_harmony_napi;
}

inline void registerEtsFunction(const std::string& name, napi_env env, napi_value value) {
    std::lock_guard<std::mutex> lock(g_ets_functions_mutex);
    auto existing = g_ets_functions_table.find(name);
    if (existing != g_ets_functions_table.end()) {
        napi_delete_reference(existing->second.env, existing->second.ref);
        g_ets_functions_table.erase(existing);
    }

    napi_ref ref;
    napi_create_reference(env, value, 1, &ref);
    g_ets_functions_table[name] = { name, env, ref };
}

} 

a2ui::IHarmonyNAPI* implHarmonyNAPI() {
    return a2ui::implHarmonyNAPI();
}

// Global napi_env cache set during Init and used by C++ components such as LottieComponent when creating thread-safe functions
static napi_env g_napiEnv = nullptr;
// Main thread ID recorded in RegisterEntryModule (__attribute__((constructor)))
static pthread_t g_mainThreadId = 0;
napi_env a2ui_get_napi_env() { return g_napiEnv; }

// Thread-safe function created in Init and used to dispatch worker-thread callbacks onto the main thread
static napi_threadsafe_function g_mainTsfn = nullptr;
napi_threadsafe_function a2ui_get_main_tsfn() { return g_mainTsfn; }

// App sandbox root directory (filesDir), set in SetWorkingDir and used by components such as IconComponent to build absolute resource paths
static std::string g_filesDir;
const std::string& a2ui_get_files_dir() { return g_filesDir; }
// Globally cached MessageThreadFactory pointer
static uint64_t g_messageThreadFactoryPtr = 0;

// ==================== Platform Function Management ====================
// Mapping from name to HarmonyPlatformFunction instance for lifecycle management
static std::mutex g_platformFunctionsMutex;
static std::map<std::string, agenui::HarmonyPlatformFunction*> g_platformFunctions;

// ==================== Multi-instance Management ====================
// Mapping from engineId to A2UIMessageListener instance
static std::mutex g_messageListenersMutex;
static std::map<int, agenui::A2UIMessageListener*> g_messageListeners;

/**
 * @brief Look up A2UIMessageListener by engineId
 * @return Pointer when found, otherwise nullptr
 */
static agenui::A2UIMessageListener* findMessageListenerByEngineId(int engineId) {
    std::lock_guard<std::mutex> lock(g_messageListenersMutex);
    auto it = g_messageListeners.find(engineId);
    if (it != g_messageListeners.end()) {
        return it->second;
    }
    HM_LOGE("A2UIMessageListener not found for engineId=%d", engineId);
    return nullptr;
}

/**
 * @brief Look up the engine-layer ISurfaceManager by engineId
 * @return Pointer when found, otherwise nullptr
 */
static agenui::ISurfaceManager* findSurfaceManagerByEngineId(int engineId) {
    auto* engine = agenui::getAGenUIEngine();
    if (!engine) {
        HM_LOGE("AGenUI Engine not initialized");
        return nullptr;
    }
    auto* sm = engine->findSurfaceManager(engineId);
    if (!sm) {
        HM_LOGE("ISurfaceManager not found for engineId=%d", engineId);
    }
    return sm;
}

// ==================== NAPI Helper Macros ====================
#define NAPI_RETURN_UNDEFINED(env) \
    do { napi_value _r; napi_get_undefined(env, &_r); return _r; } while(0)

#define NAPI_GET_ARGS(env, info, count, args) \
    do { size_t _argc = count; napi_get_cb_info(env, info, &_argc, args, nullptr, nullptr); \
         if (_argc < count) { HM_LOGE("%s: Expected %d args, got %zu", __func__, count, _argc); NAPI_RETURN_UNDEFINED(env); } } while(0)

// ==================== NAPI Helper Functions ====================

/**
 * @brief Read a UTF-8 string napi_value into a std::string.
 * Performs the standard two-call pattern: query size, then read into a sized buffer.
 * Uses std::vector<char> for RAII so the buffer is freed even on exceptions.
 */
static inline std::string napiGetString(napi_env env, napi_value value) {
    size_t strSize = 0;
    napi_get_value_string_utf8(env, value, nullptr, 0, &strSize);
    std::vector<char> buf(strSize + 1, '\0');
    napi_get_value_string_utf8(env, value, buf.data(), buf.size(), &strSize);
    return std::string(buf.data(), strSize);
}

/**
 * @brief Build a napi boolean value in one call.
 */
static inline napi_value napiBoolean(napi_env env, bool value) {
    napi_value result;
    napi_get_boolean(env, value, &result);
    return result;
}

/**
 * @brief Verify that the given argument is a function. On failure, log an error
 * tagged with the caller name and return false. The caller is expected to
 * return early using NAPI_RETURN_UNDEFINED on failure.
 */
static inline bool napiCheckArgIsFunction(napi_env env, napi_value arg, const char* callerName) {
    napi_valuetype valueType;
    napi_typeof(env, arg, &valueType);
    if (valueType != napi_function) {
        HM_LOGE("%s: Argument is not a function", callerName);
        return false;
    }
    return true;
}

// ==================== NAPI Function Implementations ====================

static napi_value Add(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2] = {nullptr};

    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    napi_valuetype valuetype0;
    napi_typeof(env, args[0], &valuetype0);

    napi_valuetype valuetype1;
    napi_typeof(env, args[1], &valuetype1);

    double value0;
    napi_get_value_double(env, args[0], &value0);

    double value1;
    napi_get_value_double(env, args[1], &value1);

    napi_value sum;
    napi_create_double(env, value0 + value1, &sum);

    return sum;
}

/**
 * @brief Initialize the AGenUI engine (replaces Start)
 * Create the global IAGenUIEngine instance and configure shared services
 */
static napi_value Start(napi_env env, napi_callback_info info) {
    HM_LOGI("AGenUI Start called - initializing IAGenUIEngine");
    agenui::IAGenUIEngine* engine = agenui::initAGenUIEngine();
    if (engine == nullptr) {
        HM_LOGE("Failed to initialize AGenUI Engine");
        NAPI_RETURN_UNDEFINED(env);
    }

    // Configure the device service (global singleton)
    engine->setPlatformLayoutBridge(new a2ui::A2UIPlatformLayoutBridge());

    HM_LOGI("AGenUI Engine initialized successfully");
    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Stop the AGenUI engine (replaces Stop)
 * Destroy all SurfaceManager instances and the global engine
 */
static napi_value Stop(napi_env env, napi_callback_info info) {
    HM_LOGI("AGenUI Stop called - destroying IAGenUIEngine");

    auto* engine = agenui::getAGenUIEngine();
    if (engine) {
        {
            std::lock_guard<std::mutex> lock(g_platformFunctionsMutex);
            for (auto it = g_platformFunctions.begin(); it != g_platformFunctions.end(); ) {
                engine->unregisterFunction(it->first);
                delete it->second;
                it = g_platformFunctions.erase(it);
            }
            HM_LOGI("Cleaned up all PlatformFunctions");
        }

        // Clear MessageListener instances that were not destroyed manually
        {
            std::lock_guard<std::mutex> lock(g_messageListenersMutex);
            for (auto it = g_messageListeners.begin(); it != g_messageListeners.end(); ) {
                int engineId = it->first;
                auto* listener = it->second;
                auto* sm = engine->findSurfaceManager(engineId);
                if (sm) {
                    sm->removeSurfaceEventListener(listener);
                    engine->destroySurfaceManager(sm);
                }
                delete listener;
                it = g_messageListeners.erase(it);
                HM_LOGI("Cleaned up listener for engineId=%d", engineId);
            }
        }
    }

    agenui::destroyAGenUIEngine();
    HM_LOGI("AGenUI Engine destroyed");

    // Release the global thread-safe function
    if (g_mainTsfn) {
        // First call unref to remove the reference added in Init so the TSFN can shut down normally
        napi_unref_threadsafe_function(env, g_mainTsfn);
        // Then call release to decrement the thread count (matching initial_thread_count=1)
        napi_release_threadsafe_function(g_mainTsfn, napi_tsfn_release);
        g_mainTsfn = nullptr;
        HM_LOGI("g_mainTsfn released");
    }

    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Create a SurfaceManager instance
 * @return number (engineId)
 */
static napi_value CreateSurfaceManager(napi_env env, napi_callback_info info) {
    HM_LOGI("CreateSurfaceManager called");

    auto* engine = agenui::getAGenUIEngine();
    if (!engine) {
        HM_LOGE("CreateSurfaceManager: Engine not initialized");
        napi_value result;
        napi_create_int32(env, 0, &result);
        return result;
    }

    auto* sm = engine->createSurfaceManager();
    if (!sm) {
        HM_LOGE("CreateSurfaceManager: Failed to create SurfaceManager");
        napi_value result;
        napi_create_int32(env, 0, &result);
        return result;
    }

    int engineId = sm->getEngineId();

    auto* listener = new agenui::A2UIMessageListener(engineId);
    listener->setTsfn(g_mainTsfn);
    sm->addSurfaceEventListener(listener);
    {
        std::lock_guard<std::mutex> lock(g_messageListenersMutex);
        g_messageListeners[engineId] = listener;
    }

    a2ui::A2UISurfaceManager* surfaceManager = listener->getSurfaceManager();
    sm->setComponentRenderObservable(surfaceManager->getComponentRenderObservable());
    sm->setSurfaceLayoutObservable(surfaceManager->getSurfaceLayoutObservable());

    HM_LOGI("CreateSurfaceManager: engineId=%d created successfully", engineId);

    napi_value result;
    napi_create_int32(env, engineId, &result);
    return result;
}

/**
 * @brief Destroy the SurfaceManager instance
 * @param args[0] engineId (number)
 */
static napi_value DestroySurfaceManager(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        HM_LOGE("DestroySurfaceManager: Expected 1 argument");
        NAPI_RETURN_UNDEFINED(env);
    }

    int32_t engineId = 0;
    napi_get_value_int32(env, args[0], &engineId);

    HM_LOGI("DestroySurfaceManager: engineId=%d", engineId);

    auto* engine = agenui::getAGenUIEngine();
    if (!engine) {
        HM_LOGE("DestroySurfaceManager: Engine not initialized");
        NAPI_RETURN_UNDEFINED(env);
    }

    // 1. Look up and unregister the MessageListener
    {
        std::lock_guard<std::mutex> lock(g_messageListenersMutex);
        auto listenerIt = g_messageListeners.find(engineId);
        if (listenerIt != g_messageListeners.end()) {
            auto* listener = listenerIt->second;
            auto* sm = engine->findSurfaceManager(engineId);
            if (sm) {
                sm->removeSurfaceEventListener(listener);
            }
            delete listener;
            g_messageListeners.erase(listenerIt);
        }
    }

    // 2. Destroy the engine-layer SurfaceManager
    auto* sm = engine->findSurfaceManager(engineId);
    if (sm) {
        engine->destroySurfaceManager(sm);
    }

    HM_LOGI("DestroySurfaceManager: engineId=%d destroyed", engineId);
    NAPI_RETURN_UNDEFINED(env);
}

static napi_value SendMockData(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 1) {
        HM_LOGE("SendMockData: Invalid argument count");
        NAPI_RETURN_UNDEFINED(env);
    }
    
    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Set the working directory
 */
static napi_value SetWorkingDir(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 1) {
        HM_LOGE("SetWorkingDir: Invalid argument count");
        NAPI_RETURN_UNDEFINED(env);
    }
    
    std::string workingDir = napiGetString(env, args[0]);

    HM_LOGI("SetWorkingDir: %s", workingDir.c_str());
    
    // Store filesDir in a global variable
    g_filesDir = workingDir;
    
    auto* engine = agenui::getAGenUIEngine();
    if (engine) {
        engine->setWorkingDir(workingDir);
    } else {
        HM_LOGW("SetWorkingDir: Engine not initialized yet");
    }
    
    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Remove the event listener
 */
static napi_value RemoveEventListener(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 1) {
        HM_LOGE("RemoveEventListener: Invalid argument count");
        napi_value result;
        napi_get_undefined(env, &result);
        return result;
    }
    
    HM_LOGI("RemoveEventListener called");
    
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

/**
 * @brief Get the version number
 */
static napi_value GetVersion(napi_env env, napi_callback_info info) {
    napi_value result;
    napi_create_string_utf8(env, "", NAPI_AUTO_LENGTH, &result);
    return result;
}

/**
 * @brief Request Surface creation
 * @param args[0] engineId (number)
 * @param args[1] data (string) A2UI protocol payload
 */
static napi_value RequestSurface(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 2) {
        HM_LOGE("RequestSurface: Expected 2 arguments (engineId, data)");
        NAPI_RETURN_UNDEFINED(env);
    }

    int32_t engineId = 0;
    napi_get_value_int32(env, args[0], &engineId);

    std::string requestContent = napiGetString(env, args[1]);

    HM_LOGI("RequestSurface: engineId=%d, dataLen=%zu", engineId, requestContent.size());

    auto* sm = findSurfaceManagerByEngineId(engineId);
    if (!sm) {
        HM_LOGE("RequestSurface: SurfaceManager not found for engineId=%d", engineId);
        NAPI_RETURN_UNDEFINED(env);
    }

    try {
        sm->receiveTextChunk(requestContent);
        HM_LOGI("RequestSurface: Data transmitted successfully, engineId=%d", engineId);
    } catch (const std::exception& e) {
        HM_LOGE("RequestSurface: Exception - %s", e.what());
    }

    NAPI_RETURN_UNDEFINED(env);
}
/**
 * @brief Register the A2UI surface listener
 * @param args[0] engineId (number)
 * @param args[1] listener (ISurfaceListener object)
 */
static napi_value RegisterA2UISurfaceListener(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 2) {
        HM_LOGE("RegisterA2UISurfaceListener: Expected 2 arguments");
        NAPI_RETURN_UNDEFINED(env);
    }
    
    int32_t engineId = 0;
    napi_get_value_int32(env, args[0], &engineId);

    napi_valuetype valueType;
    napi_typeof(env, args[1], &valueType);
    if (valueType != napi_object) {
        HM_LOGE("RegisterA2UISurfaceListener: Argument[1] is not an object");
        NAPI_RETURN_UNDEFINED(env);
    }
    
    auto* listener = findMessageListenerByEngineId(engineId);
    if (listener) {
        listener->registerListener(args[1]);
        HM_LOGI("RegisterA2UISurfaceListener: engineId=%d, listener registered", engineId);
    }
    
    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Unregister the A2UI surface listener
 * @param args[0] engineId (number)
 * @param args[1] listener (ISurfaceListener object)
 */
static napi_value UnregisterA2UISurfaceListener(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 2) {
        HM_LOGE("UnregisterA2UISurfaceListener: Expected 2 arguments");
        NAPI_RETURN_UNDEFINED(env);
    }
    
    int32_t engineId = 0;
    napi_get_value_int32(env, args[0], &engineId);

    napi_valuetype valueType;
    napi_typeof(env, args[1], &valueType);
    if (valueType != napi_object) {
        HM_LOGE("UnregisterA2UISurfaceListener: Argument[1] is not an object");
        NAPI_RETURN_UNDEFINED(env);
    }
    
    auto* listener = findMessageListenerByEngineId(engineId);
    if (listener) {
        listener->unregisterListener(args[1]);
        HM_LOGI("UnregisterA2UISurfaceListener: engineId=%d, listener unregistered", engineId);
    }
    
    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Clear the A2UI container
 * @param args[0] engineId (number)
 */
static napi_value ClearA2UiContainer(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        HM_LOGE("ClearA2UiContainer: Expected 1 argument");
        NAPI_RETURN_UNDEFINED(env);
    }

    int32_t engineId = 0;
    napi_get_value_int32(env, args[0], &engineId);

    HM_LOGI("ClearA2UiContainer: engineId=%d", engineId);

    auto* listener = findMessageListenerByEngineId(engineId);
    if (listener) {
        auto* surfaceManager = listener->getSurfaceManager();
        if (surfaceManager) {
            surfaceManager->unmountAllRootNodes();
        }
    }

    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Bind the surface
 * @param args[0] engineId (number)
 * @param args[1] surfaceId (string)
 * @param args[2] nodeContent (object)
 */
static napi_value BindSurface(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value args[3];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 3) {
        HM_LOGE("BindSurface: Expected 3 arguments");
        return napiBoolean(env, false);
    }

    int32_t engineId = 0;
    napi_get_value_int32(env, args[0], &engineId);

    std::string surfaceId = napiGetString(env, args[1]);

    napi_value nodeContent = args[2];

    HM_LOGI("BindSurface: engineId=%d, surfaceId=%s", engineId, surfaceId.c_str());

    auto* listener = findMessageListenerByEngineId(engineId);
    if (!listener) {
        return napiBoolean(env, false);
    }

    auto* surfaceManager = listener->getSurfaceManager();
    if (!surfaceManager) {
        HM_LOGE("BindSurface: SurfaceManager not found for engineId=%d", engineId);
        return napiBoolean(env, false);
    }

    bool success = surfaceManager->bindSurface(surfaceId, env, nodeContent);
    return napiBoolean(env, success);
}

/**
 * @brief Unbind the surface
 * @param args[0] engineId (number)
 * @param args[1] surfaceId (string)
 */
static napi_value UnbindSurface(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 2) {
        HM_LOGE("UnbindSurface: Expected 2 arguments");
        return napiBoolean(env, false);
    }

    int32_t engineId = 0;
    napi_get_value_int32(env, args[0], &engineId);

    std::string surfaceId = napiGetString(env, args[1]);

    HM_LOGI("UnbindSurface: engineId=%d, surfaceId=%s", engineId, surfaceId.c_str());

    auto* listener = findMessageListenerByEngineId(engineId);
    if (!listener) {
        return napiBoolean(env, false);
    }

    auto* surfaceManager = listener->getSurfaceManager();
    if (!surfaceManager) {
        HM_LOGE("UnbindSurface: SurfaceManager not found for engineId=%d", engineId);
        return napiBoolean(env, false);
    }

    bool success = surfaceManager->unbindSurface(surfaceId);
    return napiBoolean(env, success);
}

/**
 * @brief Register the URL open callback
 */
static napi_value RegisterOpenUrlCallback(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        HM_LOGE("RegisterOpenUrlCallback: Invalid argument count");
        NAPI_RETURN_UNDEFINED(env);
    }

    if (!napiCheckArgIsFunction(env, args[0], "RegisterOpenUrlCallback")) {
        NAPI_RETURN_UNDEFINED(env);
    }

    a2ui::OpenUrlHelper::getInstance().registerCallback(env, args[0]);
    HM_LOGI("RegisterOpenUrlCallback: Callback registered successfully");

    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Register the skill invocation callback
 */
static napi_value RegisterSkillInvokerCallback(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        HM_LOGE("RegisterSkillInvokerCallback: Invalid argument count");
        NAPI_RETURN_UNDEFINED(env);
    }

    if (!napiCheckArgIsFunction(env, args[0], "RegisterSkillInvokerCallback")) {
        NAPI_RETURN_UNDEFINED(env);
    }

    a2ui::SkillInvokerHelper::getInstance().registerCallback(env, args[0]);
    HM_LOGI("RegisterSkillInvokerCallback: Callback registered successfully");

    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Register the ETS function in the C++ layer
 */
static napi_value RegisterEtsFunction(napi_env env, napi_callback_info info) {
    HM_LOGE("RegisterEtsFunction: invoked");
    size_t argc = 2;
    napi_value args[2];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 2) {
        HM_LOGE("RegisterEtsFunction: Expected 2 arguments, got %zu", argc);
        NAPI_RETURN_UNDEFINED(env);
    }

    std::string name = napiGetString(env, args[0]);

    if (!napiCheckArgIsFunction(env, args[1], "RegisterEtsFunction (second arg)")) {
        NAPI_RETURN_UNDEFINED(env);
    }

    a2ui::registerEtsFunction(name, env, args[1]);
    
    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Receive screen information from the ETS side
 */
static napi_value SetDeviceInfo(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value args[3];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 3) {
        HM_LOGE("SetDeviceInfo: Expected 3 arguments, got %zu", argc);
        NAPI_RETURN_UNDEFINED(env);
    }

    double width = 0.0;
    double height = 0.0;
    double density = 0.0;
    napi_get_value_double(env, args[0], &width);
    napi_get_value_double(env, args[1], &height);
    napi_get_value_double(env, args[2], &density);

    a2ui::setDeviceInfo(static_cast<int>(width), static_cast<int>(height), static_cast<float>(density));

    HM_LOGI("SetDeviceInfo: width=%d, height=%d, density=%f", static_cast<int>(width), static_cast<int>(height), static_cast<float>(density));

    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Get the property value from ComponentState
 */
static napi_value HybridFactory_getAttribute(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 2) {
        HM_LOGE("HybridFactory_getAttribute: Expected 2 arguments, got %zu", argc);
        napi_value result;
        napi_create_string_utf8(env, "", NAPI_AUTO_LENGTH, &result);
        return result;
    }
    
    uint64_t ptrValue;
    bool lossless;
    napi_get_value_bigint_uint64(env, args[0], &ptrValue, &lossless);
    void* ptr = reinterpret_cast<void*>(ptrValue);

    std::string key = napiGetString(env, args[1]);

    a2ui::ComponentState* componentState = reinterpret_cast<a2ui::ComponentState*>(ptr);
    std::string value;
    if (componentState) {
        value = componentState->getProperty(key);
    }
    
    HM_LOGI("HybridFactory_getAttribute: ptr=%p, key=%s, value=%s", ptr, key.c_str(), value.c_str());
    
    napi_value result;
    napi_create_string_utf8(env, value.c_str(), NAPI_AUTO_LENGTH, &result);
    return result;
}


/**
 * @brief Get the full property JSON snapshot from ComponentState
 * @param args[0] ptr (number) - ComponentState pointer
 * @return string - Full property JSON snapshot
 */
static napi_value HybridFactory_getPropertiesJson(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    napi_value result;
    if (argc < 1) {
        napi_create_string_utf8(env, "{}", NAPI_AUTO_LENGTH, &result);
        return result;
    }

    uint64_t ptrValue = 0;
    bool lossless = true;
    napi_get_value_bigint_uint64(env, args[0], &ptrValue, &lossless);
    a2ui::ComponentState* state = reinterpret_cast<a2ui::ComponentState*>(ptrValue);
    std::string propertiesJson = "{}";
    if (state != nullptr) {
        propertiesJson = state->getProperties().dump();
    }

    napi_create_string_utf8(env, propertiesJson.c_str(), propertiesJson.size(), &result);
    return result;
}


/**
 * @brief Notify the engine that a component has finished rendering with its measured dimensions. Supports Markdown, Web, and other custom components.
 */
static napi_value ReportComponentRenderSize(napi_env env, napi_callback_info info) {
    size_t argc = 6;
    napi_value args[6];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 5) {
        HM_LOGE("ReportComponentRenderSize: Expected 5 arguments, got %zu", argc);
        NAPI_RETURN_UNDEFINED(env);
    }
    
    std::string surfaceId   = napiGetString(env, args[0]);
    std::string componentId = napiGetString(env, args[1]);
    std::string type        = napiGetString(env, args[2]);

    double height = 0.0;
    napi_get_value_double(env, args[3], &height);

    double width = 0.0;
    napi_get_value_double(env, args[4], &width);

    HM_LOGI("ReportComponentRenderSize: surfaceId=%s, componentId=%s, type=%s, height=%f, width=%f", surfaceId.c_str(), componentId.c_str(), type.c_str(), height, width);
    
    int engineId = agenui::A2UIMessageListener::findEngineIdBySurfaceId(surfaceId);
    auto* listener = findMessageListenerByEngineId(engineId);
    if (!listener) {
        HM_LOGE("ReportComponentRenderSize: listener not found for surfaceId=%s", surfaceId.c_str());
        NAPI_RETURN_UNDEFINED(env);
    }
    agenui::IComponentRenderObservable* observable = listener->getSurfaceManager()->getComponentRenderObservable();
    if (!observable) {
        HM_LOGE("ReportComponentRenderSize: IComponentRenderObservable not found for surfaceId=%s", surfaceId.c_str());
        NAPI_RETURN_UNDEFINED(env);
    }

    agenui::ComponentRenderInfo markdownInfo;
    markdownInfo.surfaceId   = surfaceId;
    markdownInfo.componentId = componentId;
    markdownInfo.type        = type;
    markdownInfo.height      = a2ui::UnitConverter::vpToA2ui(height);
    markdownInfo.width       = a2ui::UnitConverter::vpToA2ui(width);;
    observable->notifyRenderFinish(markdownInfo);
    
    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Set the message thread factory
 */
static napi_value SetMessageThreadFactory(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        HM_LOGE("SetMessageThreadFactory: Invalid argument count");
        NAPI_RETURN_UNDEFINED(env);
    }

    uint64_t ptrValue = 0;
    bool lossless = true;
    napi_get_value_bigint_uint64(env, args[0], &ptrValue, &lossless);
    
    g_messageThreadFactoryPtr = ptrValue;
    HM_LOGI("SetMessageThreadFactory: cached ptrValue=%llu", ptrValue);
    
    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Notify the C++ layer that the surface size changed
 */
static napi_value Surface_onSizeChanged(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value args[3];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 3) {
        HM_LOGE("OnSurfaceSizeChanged: Expected 3 arguments, got %zu", argc);
        NAPI_RETURN_UNDEFINED(env);
    }

    std::string surfaceId = napiGetString(env, args[0]);

    double width = 0.0;
    napi_get_value_double(env, args[1], &width);

    double height = 0.0;
    napi_get_value_double(env, args[2], &height);

    HM_LOGI("OnSurfaceSizeChanged: surfaceId=%s, width=%f, height=%f", surfaceId.c_str(), width, height);

    int engineId = agenui::A2UIMessageListener::findEngineIdBySurfaceId(surfaceId);
    auto* listener = findMessageListenerByEngineId(engineId);
    if (!listener) {
        HM_LOGE("OnSurfaceSizeChanged: listener not found for surfaceId=%s", surfaceId.c_str());
        NAPI_RETURN_UNDEFINED(env);
    }
    agenui::ISurfaceLayoutObservable* observable = listener->getSurfaceManager()->getSurfaceLayoutObservable();
    if (!observable) {
        HM_LOGE("OnSurfaceSizeChanged: ISurfaceLayoutObservable not found for surfaceId=%s", surfaceId.c_str());
        NAPI_RETURN_UNDEFINED(env);
    }

    agenui::SurfaceLayoutInfo surfaceInfo;
    surfaceInfo.surfaceId = surfaceId;
    surfaceInfo.width     = a2ui::UnitConverter::vpToA2ui(width);
    surfaceInfo.height    = a2ui::UnitConverter::vpToA2ui(height);
    observable->notifySurfaceSizeChanged(surfaceInfo);

    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Set the theme configuration
 */
static napi_value SetThemeConfig(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        HM_LOGE("SetThemeConfig: Expected at least 1 argument, got %zu", argc);
        NAPI_RETURN_UNDEFINED(env);
    }

    std::string config = napiGetString(env, args[0]);

    auto* engine = agenui::getAGenUIEngine();
    if (!engine) {
        HM_LOGE("SetThemeConfig: Engine not initialized");
        NAPI_RETURN_UNDEFINED(env);
    }

    std::string errorResult;
    bool success = engine->loadThemeConfig(config, errorResult);
    if (!success) {
        HM_LOGE("SetThemeConfig: failed, error=%s", errorResult.c_str());
    } else {
        HM_LOGI("SetThemeConfig: success");
    }

    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Set the DesignToken configuration
 */
static napi_value SetDesignTokenConfig(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        HM_LOGE("SetDesignTokenConfig: Expected at least 1 argument, got %zu", argc);
        NAPI_RETURN_UNDEFINED(env);
    }

    std::string config = napiGetString(env, args[0]);

    auto* engine = agenui::getAGenUIEngine();
    if (!engine) {
        HM_LOGE("SetDesignTokenConfig: Engine not initialized");
        NAPI_RETURN_UNDEFINED(env);
    }

    std::string errorResult;
    bool success = engine->loadDesignTokenConfig(config, errorResult);
    if (!success) {
        HM_LOGE("SetDesignTokenConfig: failed, error=%s", errorResult.c_str());
    } else {
        HM_LOGI("SetDesignTokenConfig: success");
    }

    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Register a platform function (replaces registerSkill + setSkillInvoker)
 * Each skill owns a HarmonyPlatformFunction instance with its own callback
 * @param args[0] name (string) - Function name used for lifecycle management and unregistration
 * @param args[1] config (string) - Skill configuration JSON
 * @param args[2] callback (function) - Per-skill callback: (paramsJson: string) => string
 */
static napi_value RegisterFunction(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value args[3];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 3) {
        HM_LOGE("RegisterFunction: Expected 3 arguments, got %{public}zu", argc);
        NAPI_RETURN_UNDEFINED(env);
    }

    // Argument 1: name (string)
    std::string name = napiGetString(env, args[0]);

    // Argument 2: config (string)
    std::string config = napiGetString(env, args[1]);

    // Argument 3: callback (function)
    if (!napiCheckArgIsFunction(env, args[2], "RegisterFunction (third arg)")) {
        NAPI_RETURN_UNDEFINED(env);
    }

    auto* engine = agenui::getAGenUIEngine();
    if (!engine) {
        HM_LOGE("RegisterFunction: Engine not initialized");
        NAPI_RETURN_UNDEFINED(env);
    }

    // If a function with the same name already exists, first notify the engine to unregister it, then destroy the old instance to avoid dangling pointers
    {
        std::lock_guard<std::mutex> lock(g_platformFunctionsMutex);
        auto it = g_platformFunctions.find(name);
        if (it != g_platformFunctions.end()) {
            engine->unregisterFunction(name);
            delete it->second;
            g_platformFunctions.erase(it);
        }
    }

    // Create the HarmonyPlatformFunction instance and keep its callback reference
    // Pass g_mainTsfn and g_mainThreadId so callSync can be invoked safely from non-main threads
    auto* function = new agenui::HarmonyPlatformFunction(env, args[2], g_mainTsfn, g_mainThreadId);
    if (!function->isValid()) {
        HM_LOGE("RegisterFunction: Failed to create HarmonyPlatformFunction for %s", name.c_str());
        delete function;
        NAPI_RETURN_UNDEFINED(env);
    }

    // Register in the C++ engine
    engine->registerFunction(config, function);

    // Store in the NAPI-layer map for lifecycle management
    {
        std::lock_guard<std::mutex> lock(g_platformFunctionsMutex);
        g_platformFunctions[name] = function;
    }

    HM_LOGI("RegisterFunction: name=%s registered successfully", name.c_str());

    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Unregister the platform function
 * Before destruction, notify the engine that the function must no longer be called to avoid dangling pointers
 * @param args[0] name (string) - Function name
 */
static napi_value UnregisterFunction(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        HM_LOGE("UnregisterFunction: Expected 1 argument");
        NAPI_RETURN_UNDEFINED(env);
    }

    std::string name = napiGetString(env, args[0]);

    auto* engine = agenui::getAGenUIEngine();
    if (!engine) {
        HM_LOGE("UnregisterFunction: Engine not initialized");
        NAPI_RETURN_UNDEFINED(env);
    }

    engine->unregisterFunction(name);

    {
        std::lock_guard<std::mutex> lock(g_platformFunctionsMutex);
        auto it = g_platformFunctions.find(name);
        if (it != g_platformFunctions.end()) {
            delete it->second;
            g_platformFunctions.erase(it);
            HM_LOGI("UnregisterFunction: destroyed HarmonyPlatformFunction for %s", name.c_str());
        }
    }

    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Set day/night mode (new in v2.0, same behavior as SetThemeMode)
 * @param args[0] mode (string) - "light" or "dark"
 */
static napi_value SetDayNightMode(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        HM_LOGE("SetDayNightMode: Expected 1 argument, got %zu", argc);
        NAPI_RETURN_UNDEFINED(env);
    }

    std::string mode = napiGetString(env, args[0]);

    if (mode != "light" && mode != "dark") {
        HM_LOGE("SetDayNightMode: invalid mode '%s', expected 'light' or 'dark'", mode.c_str());
        NAPI_RETURN_UNDEFINED(env);
    }

    auto* engine = agenui::getAGenUIEngine();
    if (engine) {
        engine->setDayNightMode(mode);
        HM_LOGI("SetDayNightMode: success, mode=%s", mode.c_str());
    }

    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Register the default theme and DesignToken configuration (new in v2.0)
 * @param args[0] theme (string) - theme configuration JSON
 * @param args[1] designToken (string) - DesignToken configuration JSON
 * @return boolean - whether the operation succeeded
 */
static napi_value RegisterDefaultTheme(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 2) {
        HM_LOGE("RegisterDefaultTheme: Expected 2 arguments, got %zu", argc);
        return napiBoolean(env, false);
    }

    // Get the theme string
    std::string theme = napiGetString(env, args[0]);

    // Get the designToken string
    std::string designToken = napiGetString(env, args[1]);

    HM_LOGI("RegisterDefaultTheme: theme length=%zu, designToken length=%zu", theme.size(), designToken.size());

    auto* engine = agenui::getAGenUIEngine();
    if (!engine) {
        HM_LOGE("RegisterDefaultTheme: Engine not initialized");
        return napiBoolean(env, false);
    }

    // Register the theme configuration
    std::string resultStr;
    bool themeResult = engine->loadThemeConfig(theme, resultStr);
    if (!themeResult) {
        HM_LOGE("RegisterDefaultTheme: Theme registration failed: %s", resultStr.c_str());
        return napiBoolean(env, false);
    }

    // Register the DesignToken configuration
    bool tokenResult = engine->loadDesignTokenConfig(designToken, resultStr);
    if (!tokenResult) {
        HM_LOGE("RegisterDefaultTheme: DesignToken registration failed: %s", resultStr.c_str());
        return napiBoolean(env, false);
    }

    HM_LOGI("RegisterDefaultTheme: success");
    return napiBoolean(env, true);
}

/**
 * @brief Begin a streaming data session (new in v2.0)
 * @param args[0] engineId (number)
 */
static napi_value BeginTextStream(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        HM_LOGE("BeginTextStream: Expected 1 argument, got %zu", argc);
        NAPI_RETURN_UNDEFINED(env);
    }

    int32_t engineId = 0;
    napi_get_value_int32(env, args[0], &engineId);

    HM_LOGI("BeginTextStream: engineId=%d", engineId);

    auto* sm = findSurfaceManagerByEngineId(engineId);
    if (!sm) {
        HM_LOGE("BeginTextStream: SurfaceManager not found for engineId=%d", engineId);
        NAPI_RETURN_UNDEFINED(env);
    }

    sm->beginTextStream();
    HM_LOGI("BeginTextStream: success");

    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief End a streaming data session (new in v2.0)
 * @param args[0] engineId (number)
 */
static napi_value EndTextStream(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        HM_LOGE("EndTextStream: Expected 1 argument, got %zu", argc);
        NAPI_RETURN_UNDEFINED(env);
    }

    int32_t engineId = 0;
    napi_get_value_int32(env, args[0], &engineId);

    HM_LOGI("EndTextStream: engineId=%d", engineId);

    auto* sm = findSurfaceManagerByEngineId(engineId);
    if (!sm) {
        HM_LOGE("EndTextStream: SurfaceManager not found for engineId=%d", engineId);
        NAPI_RETURN_UNDEFINED(env);
    }

    sm->endTextStream();
    HM_LOGI("EndTextStream: success");

    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Register the custom component factory (new in v2.0)
 * @param args[0] type (string) - component type name
 * @param args[1] creator (function) - component factory function
 */
static napi_value RegisterComponent(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 2) {
        HM_LOGE("RegisterComponent: Expected 2 arguments, got %zu", argc);
        NAPI_RETURN_UNDEFINED(env);
    }

    // Get the component type
    std::string type = napiGetString(env, args[0]);

    // Verify that the second argument is a function
    if (!napiCheckArgIsFunction(env, args[1], "RegisterComponent (second arg)")) {
        NAPI_RETURN_UNDEFINED(env);
    }

    HM_LOGI("RegisterComponent: type=%s", type.c_str());

    // Return success for now
    HM_LOGI("RegisterComponent: success (stub implementation)");

    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Register the ETS image loader
 * The host app injects an IImageLoader through SurfaceManager.setImageLoader(loader),
 * then passes the ETS loader object to the C++ bridge through this NAPI entry.
 * @param args[0] loader (object) - ETS object implementing IImageLoader
 * @return undefined
 */
static napi_value RegisterImageLoader(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        HM_LOGE("RegisterImageLoader: Expected 1 argument, got %zu", argc);
        napi_value result;
        napi_get_undefined(env, &result);
        return result;
    }

    a2ui::ImageLoaderBridge::getInstance().registerLoader(env, args[0]);
    HM_LOGI("RegisterImageLoader: IImageLoader registered successfully");
    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Forward a UI action to ISurfaceManager::submitUIAction
 * @param args[0] engineId (number)
 * @param args[1] surfaceId (string)
 * @param args[2] sourceComponentId (string)
 * @param args[3] contextJson (string)
 */
static napi_value SubmitUIAction(napi_env env, napi_callback_info info) {
    size_t argc = 4;
    napi_value args[4];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 4) {
        HM_LOGE("SubmitUIAction: Expected 4 arguments, got %zu", argc);
        NAPI_RETURN_UNDEFINED(env);
    }

    int32_t engineId = 0;
    napi_get_value_int32(env, args[0], &engineId);

    std::string surfaceId         = napiGetString(env, args[1]);
    std::string sourceComponentId = napiGetString(env, args[2]);
    std::string contextJson       = napiGetString(env, args[3]);

    HM_LOGI("SubmitUIAction: engineId=%d, surfaceId=%s, sourceComponentId=%s", engineId, surfaceId.c_str(), sourceComponentId.c_str());

    auto* sm = findSurfaceManagerByEngineId(engineId);
    if (sm) {
        agenui::ActionMessage msg;
        msg.surfaceId = std::move(surfaceId);
        msg.sourceComponentId = std::move(sourceComponentId);
        msg.contextJson = std::move(contextJson);
        sm->submitUIAction(msg);
    }

    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Forward UI data model changes to ISurfaceManager::submitUIDataModel
 * @param args[0] engineId (number)
 * @param args[1] surfaceId (string)
 * @param args[2] componentId (string)
 * @param args[3] change (string)
 */
static napi_value SubmitUIDataModel(napi_env env, napi_callback_info info) {
    size_t argc = 4;
    napi_value args[4];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 4) {
        HM_LOGE("SubmitUIDataModel: Expected 4 arguments, got %zu", argc);
        NAPI_RETURN_UNDEFINED(env);
    }

    int32_t engineId = 0;
    napi_get_value_int32(env, args[0], &engineId);

    std::string surfaceId   = napiGetString(env, args[1]);
    std::string componentId = napiGetString(env, args[2]);
    std::string change      = napiGetString(env, args[3]);

    HM_LOGI("SubmitUIDataModel: engineId=%d, surfaceId=%s, componentId=%s", engineId, surfaceId.c_str(), componentId.c_str());

    auto* sm = findSurfaceManagerByEngineId(engineId);
    if (sm) {
        agenui::SyncUIToDataMessage msg;
        msg.surfaceId = std::move(surfaceId);
        msg.componentId = std::move(componentId);
        msg.change = std::move(change);
        sm->submitUIDataModel(msg);
    }

    NAPI_RETURN_UNDEFINED(env);
}

/**
 * @brief Destroy the specified surface
 * @param args[0] engineId (number)
 * @param args[1] surfaceId (string)
 */
static napi_value DestroySurface(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 2) {
        HM_LOGE("DestroySurface: Expected 2 arguments, got %zu", argc);
        NAPI_RETURN_UNDEFINED(env);
    }

    int32_t engineId = 0;
    napi_get_value_int32(env, args[0], &engineId);

    std::string surfaceId = napiGetString(env, args[1]);

    std::string requestContent = "{\"version\":\"v0.9\",\"deleteSurface\":{\"surfaceId\":\"" + surfaceId + "\"}}";
    HM_LOGI("DestroySurface: engineId=%d, surfaceId=%s", engineId, surfaceId.c_str());
    
    auto* sm = findSurfaceManagerByEngineId(engineId);
    if (sm) {
        sm->receiveTextChunk(requestContent);
    }

    NAPI_RETURN_UNDEFINED(env);
}


/**
 * @brief Create a DrawableDescriptor from raw pixel data supplied by ETS after image load success
 * This bypasses the unreliable OH_ArkUI_GetDrawableDescriptorFromNapiValue path.
 *
 * @param args[0] requestId   (string)      - Request ID
 * @param args[1] bytes       (ArrayBuffer) - Raw RGBA/BGRA pixel data
 * @param args[2] width       (number)      - Width in px
 * @param args[3] height      (number)      - Height(px)
 * @param args[4] pixelFormat (number)      - Pixel format: RGBA_8888=3, BGRA_8888=4
 * @param args[5] alphaType   (number)      - Alpha type
 * @return undefined
 */
static napi_value SetImagePixelMap(napi_env env, napi_callback_info info) {
    size_t argc = 6;
    napi_value args[6];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 6) {
        HM_LOGE("SetImagePixelMap: Expected 6 arguments, got %zu", argc);
        napi_value result;
        napi_get_undefined(env, &result);
        return result;
    }

    std::string requestId = napiGetString(env, args[0]);

    napi_valuetype bytesType = napi_undefined;
    napi_typeof(env, args[1], &bytesType);
    bool isArrayBuffer = false;
    napi_is_arraybuffer(env, args[1], &isArrayBuffer);
    if (!isArrayBuffer) {
        HM_LOGE("SetImagePixelMap: args[1] is not ArrayBuffer, requestId=%s", requestId.c_str());
        a2ui::ImageLoaderBridge::getInstance().onFailed(requestId, false);
        napi_value ret;
        napi_get_undefined(env, &ret);
        return ret;
    }
    void* rawData = nullptr;
    size_t dataLen = 0;
    napi_get_arraybuffer_info(env, args[1], &rawData, &dataLen);

    double width = 0.0, height = 0.0, pixelFormat = 0.0, alphaType = 0.0;
    napi_get_value_double(env, args[2], &width);
    napi_get_value_double(env, args[3], &height);
    napi_get_value_double(env, args[4], &pixelFormat);
    napi_get_value_double(env, args[5], &alphaType);

    HM_LOGI("SetImagePixelMap: requestId=%s dataLen=%zu w=%d h=%d fmt=%d alpha=%d",
        requestId.c_str(), dataLen,
        static_cast<int>(width), static_cast<int>(height),
        static_cast<int>(pixelFormat), static_cast<int>(alphaType));

    if (rawData == nullptr || dataLen == 0 || width <= 0 || height <= 0) {
        HM_LOGE("SetImagePixelMap: invalid data, requestId=%s", requestId.c_str());
        a2ui::ImageLoaderBridge::getInstance().onFailed(requestId, false);
        napi_value ret;
        napi_get_undefined(env, &ret);
        return ret;
    }

    a2ui::ImageLoaderBridge::getInstance().setImagePixelMapFromBytes(
        requestId,
        static_cast<uint8_t*>(rawData),
        dataLen,
        static_cast<int32_t>(width),
        static_cast<int32_t>(height),
        static_cast<int32_t>(pixelFormat),
        static_cast<int32_t>(alphaType)
    );

    napi_value ret;
    napi_get_undefined(env, &ret);
    return ret;
}

/**
 * @brief Callback entry for ETS image load failure or cancellation
 * Successful loads use setImagePixelMap instead of this entry.
 *
 * @param args[0] requestId  (string)  - Request ID
 * @param args[1] isCancelled (boolean) - Whether the request was cancelled
 * @return undefined
 */
static napi_value OnImageLoadFailed(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        HM_LOGE("OnImageLoadFailed: Expected at least 1 argument, got %zu", argc);
        napi_value result;
        napi_get_undefined(env, &result);
        return result;
    }

    std::string requestId = napiGetString(env, args[0]);

    bool isCancelled = false;
    if (argc >= 2) {
        napi_get_value_bool(env, args[1], &isCancelled);
    }

    HM_LOGI("OnImageLoadFailed: requestId=%s cancelled=%d", requestId.c_str(), isCancelled);

    a2ui::ImageLoaderBridge::getInstance().onFailed(requestId, isCancelled);

    napi_value ret;
    napi_get_undefined(env, &ret);
    return ret;
}

/**
 * @brief Look up engineId by surfaceId
 * @param args[0] surfaceId (string)
 * @return number - engineId, or 0 if not found
 */
static napi_value FindEngineIdBySurfaceId(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        HM_LOGE("FindEngineIdBySurfaceId: Expected 1 argument, got %zu", argc);
        napi_value result;
        napi_create_int32(env, 0, &result);
        return result;
    }

    std::string surfaceId = napiGetString(env, args[0]);
    int engineId = agenui::A2UIMessageListener::findEngineIdBySurfaceId(surfaceId);

    HM_LOGI("FindEngineIdBySurfaceId: surfaceId=%s -> engineId=%d", surfaceId.c_str(), engineId);

    napi_value result;
    napi_create_int32(env, engineId, &result);
    return result;
}

/**
 * @brief Forward raw protocol streaming data to IAGenUIModule::transmitRawProtocolStreaming
 * @param args[0] data (string) - Raw protocol payload
 * @return undefined
 */
static napi_value ReceiveTextChunk(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 2) {
        HM_LOGE("ReceiveTextChunk: Expected 2 arguments, got %zu", argc);
        NAPI_RETURN_UNDEFINED(env);
    }

    int32_t engineId = 0;
    napi_get_value_int32(env, args[0], &engineId);

    std::string data = napiGetString(env, args[1]);

    HM_LOGI("ReceiveTextChunk: engineId=%d, data length=%zu", engineId, data.size());

    auto* sm = findSurfaceManagerByEngineId(engineId);
    if (sm) {
        sm->receiveTextChunk(data);
    }

    NAPI_RETURN_UNDEFINED(env);
}


EXTERN_C_START
static napi_value Init(napi_env env, napi_value exports)
{
    pthread_t currentThreadId = pthread_self();

    if (!pthread_equal(currentThreadId, g_mainThreadId)) {
        HM_LOGW("Init: called from non-main thread! mainThreadId=%lu, currentThreadId=%lu, env=%p - skipping",
                (unsigned long)g_mainThreadId, (unsigned long)currentThreadId, env);
        return exports;
    }

    HM_LOGI("Init: main thread init, threadId=%lu, env=%p", (unsigned long)currentThreadId, env);

    g_napiEnv = env;

    if (!g_mainTsfn) {
        napi_value asyncResourceName;
        napi_create_string_utf8(env, "A2UIMainThreadDispatcher", NAPI_AUTO_LENGTH, &asyncResourceName);
        napi_status status = napi_create_threadsafe_function(
            env,
            nullptr,
            nullptr,    // async_resource
            asyncResourceName,
            0,
            1,
            nullptr,    // thread_finalize_data
            nullptr,    // thread_finalize_cb
            nullptr,    // context
            [](napi_env env, napi_value /*js_func*/, void* /*context*/, void* data) {
                if (!data) return;
                auto* task = static_cast<agenui::MainThreadTask*>(data);
                (*task)(env);
                delete task;
            },
            &g_mainTsfn
        );
        if (status != napi_ok) {
            HM_LOGE("Init: failed to create g_mainTsfn, status=%d", status);
            g_mainTsfn = nullptr;
        } else {
            napi_ref_threadsafe_function(env, g_mainTsfn);
            HM_LOGI("Init: g_mainTsfn created and ref'd successfully");
        }
    }

    napi_property_descriptor desc[] = {
        { "add", nullptr, Add, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "start", nullptr, Start, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "stop", nullptr, Stop, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "createSurfaceManager", nullptr, CreateSurfaceManager, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "destroySurfaceManager", nullptr, DestroySurfaceManager, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "sendMockData", nullptr, SendMockData, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setWorkingDir", nullptr, SetWorkingDir, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "removeEventListener", nullptr, RemoveEventListener, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "getVersion", nullptr, GetVersion, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "requestSurface", nullptr, RequestSurface, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "registerA2UISurfaceListener", nullptr, RegisterA2UISurfaceListener, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "unregisterA2UISurfaceListener", nullptr, UnregisterA2UISurfaceListener, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "bindSurface", nullptr, BindSurface, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "unbindSurface", nullptr, UnbindSurface, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "clearA2UiContainer", nullptr, ClearA2UiContainer, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "registerOpenUrlCallback", nullptr, RegisterOpenUrlCallback, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "registerSkillInvokerCallback", nullptr, RegisterSkillInvokerCallback, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "registerEtsFunction", nullptr, RegisterEtsFunction, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setDeviceInfo", nullptr, SetDeviceInfo, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "hybridFactoryGetAttribute", nullptr, HybridFactory_getAttribute, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "hybridFactoryGetPropertiesJson", nullptr, HybridFactory_getPropertiesJson, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "reportComponentRenderSize", nullptr, ReportComponentRenderSize, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "onSurfaceSizeChanged", nullptr, Surface_onSizeChanged, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setThemeConfig", nullptr, SetThemeConfig, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setDesignTokenConfig", nullptr, SetDesignTokenConfig, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setMessageThreadFactory", nullptr, SetMessageThreadFactory, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "registerFunction", nullptr, RegisterFunction, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "unregisterFunction", nullptr, UnregisterFunction, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "submitUIAction", nullptr, SubmitUIAction, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "submitUIDataModel", nullptr, SubmitUIDataModel, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "destroySurface", nullptr, DestroySurface, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "receiveTextChunk", nullptr, ReceiveTextChunk, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "registerDefaultTheme", nullptr, RegisterDefaultTheme, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setDayNightMode", nullptr, SetDayNightMode, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "beginTextStream", nullptr, BeginTextStream, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "endTextStream", nullptr, EndTextStream, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "registerComponent", nullptr, RegisterComponent, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "registerImageLoader", nullptr, RegisterImageLoader, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setImagePixelMap", nullptr, SetImagePixelMap, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "onImageLoadFailed", nullptr, OnImageLoadFailed, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "findEngineIdBySurfaceId", nullptr, FindEngineIdBySurfaceId, nullptr, nullptr, nullptr, napi_default, nullptr },
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}
EXTERN_C_END

static napi_module demoModule = {
    .nm_version = 1,
    .nm_flags = 0,
    .nm_filename = nullptr,
    .nm_register_func = Init,
    .nm_modname = "a2ui-capi",
    .nm_priv = ((void*)0),
    .reserved = { 0 },
};

extern "C" __attribute__((constructor)) void RegisterEntryModule(void)
{
    g_mainThreadId = pthread_self();
    napi_module_register(&demoModule);
}
