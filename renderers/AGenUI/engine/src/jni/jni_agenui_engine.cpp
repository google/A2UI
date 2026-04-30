#include "jni_scoped_local_ref.h"
#include <jni.h>
#include "jni_scoped_utf_chars.h"
#include "agenui_engine_entry.h"
#include "agenui_dispatcher_types.h"
#include "agenui_platform_function.h"
#include "jni_message_listener_bridge.h"
#include "jni_android_platform_function.h"
#include "agenui_type_define.h"
#include "agenui_log.h"
#include "agenui_message_listener.h"
#include "module/agenui_engine_impl.h"
#include "module/agenui_surface_manager.h"
#include <map>
#include <mutex>
#include <string>

namespace agenui {

namespace {
    std::mutex sPlatformFunctionsMutex;
    std::map<std::string, AndroidPlatformFunction*> sPlatformFunctions;
}

static ISurfaceManager* findSurfaceManagerByEngineId(jint engineId) {
    IAGenUIEngine* engine = getAGenUIEngine();
    if (!engine) {
        AGENUI_LOG("[JNI] findSurfaceManagerByEngineId: engine is null");
        return nullptr;
    }
    ISurfaceManager* sm = engine->findSurfaceManager(engineId);
    if (!sm) {
        AGENUI_LOG("[JNI] findSurfaceManagerByEngineId: SurfaceManager not found for engineId=%d", engineId);
    }
    return sm;
}


static jlong jni_initAGenUIEngine(JNIEnv *env, jclass jcls) {
    AGENUI_LOG("[JNI] initAGenUIEngine");
    auto *engine = initAGenUIEngine();
    return (jlong)engine;
}

static void jni_destroyAGenUIEngine(JNIEnv *env, jclass jcls) {
    AGENUI_LOG("[JNI] destroyAGenUIEngine");
    destroyAGenUIEngine();
}


static jint jni_createSurfaceManager(JNIEnv *env, jclass jcls) {
    AGENUI_LOG("[JNI] createSurfaceManager");
    IAGenUIEngine* engine = getAGenUIEngine();
    if (!engine) {
        AGENUI_LOG("[JNI] createSurfaceManager: engine is null");
        return 0;
    }
    ISurfaceManager* sm = engine->createSurfaceManager();
    if (!sm) {
        AGENUI_LOG("[JNI] createSurfaceManager: failed to create SurfaceManager");
        return 0;
    }
    int engineId = sm->getEngineId();
    AGENUI_LOG("[JNI] createSurfaceManager: created with engineId=%d", engineId);
    return (jint)engineId;
}

static void jni_destroySurfaceManager(JNIEnv *env, jclass jcls, jint engineId) {
    AGENUI_LOG("[JNI] destroySurfaceManager: engineId=%d", engineId);
    IAGenUIEngine* engine = getAGenUIEngine();
    if (!engine) {
        AGENUI_LOG("[JNI] destroySurfaceManager: engine is null");
        return;
    }
    ISurfaceManager* sm = engine->findSurfaceManager(engineId);
    if (!sm) {
        AGENUI_LOG("[JNI] destroySurfaceManager: SurfaceManager not found for engineId=%d", engineId);
        return;
    }
    engine->destroySurfaceManager(sm);
    AGENUI_LOG("[JNI] destroySurfaceManager: destroyed engineId=%d", engineId);
}


static void jni_addEventListener(JNIEnv* env, jclass clazz, jint engineId, jobject javaListener) {
    AGENUI_LOG("[JNI] addEventListener: engineId=%d", engineId);
    if (javaListener == nullptr) {
        AGENUI_LOG("[JNI] addEventListener: listener is null");
        return;
    }
    ISurfaceManager* surfaceManager = findSurfaceManagerByEngineId(engineId);
    if (!surfaceManager) {
        return;
    }
    
    // Create bridge object
    auto* bridge = new JNIMessageListenerBridge(env, javaListener);
    
    // Register to SurfaceManager
    surfaceManager->addSurfaceEventListener(bridge);
    
    // Save mapping
    ListenerBridgeManager::getInstance().addMapping(env, javaListener, bridge);

    AGENUI_LOG("[JNI] addEventListener: success, engineId=%d", engineId);
}

static void jni_removeEventListener(JNIEnv* env, jclass clazz, jint engineId, jobject javaListener) {
    AGENUI_LOG("[JNI] removeEventListener: engineId=%d", engineId);
    if (javaListener == nullptr) {
        AGENUI_LOG("[JNI] removeEventListener: listener is null");
        return;
    }
    ISurfaceManager* surfaceManager = findSurfaceManagerByEngineId(engineId);
    if (!surfaceManager) {
        return;
    }
    
    // Find bridge
    auto* bridge = ListenerBridgeManager::getInstance().findBridge(env, javaListener);
    if (bridge == nullptr) {
        AGENUI_LOG("[JNI] removeEventListener: bridge not found");
        return;
    }
    
    // Remove from SurfaceManager
    surfaceManager->removeSurfaceEventListener(bridge);
    
    // Clean up
    ListenerBridgeManager::getInstance().removeMapping(env, javaListener);
    SAFELY_DELETE(bridge);
}

static void jni_submitUIAction(JNIEnv* env, jclass clazz, jint engineId, jstring jSurfaceId, jstring jSourceComponentId, jstring jContextJson) {
    AGENUI_LOG("[JNI] submitUIAction: engineId=%d", engineId);
    ISurfaceManager* surfaceManager = findSurfaceManagerByEngineId(engineId);
    if (!surfaceManager) {
        return;
    }
    ActionMessage msg;
    
    if (jSurfaceId != nullptr) {
        ScopedUtfChars surfaceId(env, jSurfaceId);
        msg.surfaceId = surfaceId.c_str();
    }
    
    if (jSourceComponentId != nullptr) {
        ScopedUtfChars sourceComponentId(env, jSourceComponentId);
        msg.sourceComponentId = sourceComponentId.c_str();
    }
    
    if (jContextJson != nullptr) {
        ScopedUtfChars contextJson(env, jContextJson);
        msg.contextJson = contextJson.c_str();
    }

    surfaceManager->submitUIAction(msg);
}

static void jni_submitUIDataModel(JNIEnv* env, jclass clazz, jint engineId, jstring jSurfaceId, jstring jComponentId, jstring jChange) {
    ISurfaceManager* surfaceManager = findSurfaceManagerByEngineId(engineId);
    if (!surfaceManager) {
        return;
    }
    SyncUIToDataMessage msg;
    if (jSurfaceId != nullptr) {
        ScopedUtfChars surfaceId(env, jSurfaceId);
        msg.surfaceId = surfaceId.c_str();
    }
    
    if (jComponentId != nullptr) {
        ScopedUtfChars componentId(env, jComponentId);
        msg.componentId = componentId.c_str();
    }
    
    if (jChange != nullptr) {
        ScopedUtfChars change(env, jChange);
        msg.change = change.c_str();
    }
    
    AGENUI_LOG("[JNI] submitUIDataModel: engineId=%d, surfaceId=%s, componentId=%s", engineId, msg.surfaceId.c_str(), msg.componentId.c_str());

    surfaceManager->submitUIDataModel(msg);
}

static void jni_submitUserInput(JNIEnv* env, jclass clazz, jint engineId, jstring jContent) {
    if (jContent == nullptr) {
        AGENUI_LOG("[JNI] submitUserInput: content is null");
        return;
    }
    ISurfaceManager* surfaceManager = findSurfaceManagerByEngineId(engineId);
    if (!surfaceManager) {
        return;
    }
    ScopedUtfChars contentObj(env, jContent);
    std::string inputContent = contentObj.c_str();
    AGENUI_LOG("[JNI] submitUserInput: engineId=%d, content=%s", engineId, inputContent.c_str());
    surfaceManager->receiveTextChunk(inputContent);
}

static void jni_setWorkdir(JNIEnv* env, jclass clazz, jstring jworkDir) {
    if (jworkDir == nullptr) {
        AGENUI_LOG("[JNI] setWorkdir: workDir is null");
        return;
    }
    IAGenUIEngine *engine = getAGenUIEngine();
    if (!engine) {
        return;
    }
    ScopedUtfChars contentObj(env, jworkDir);
    std::string workDir = contentObj.c_str();
    AGENUI_LOG("[JNI] setWorkdir: %s", workDir.c_str());
    engine->setWorkingDir(workDir);
}

static jboolean jni_loadThemeConfig(JNIEnv* env, jclass clazz, jstring jThemeConfig) {
    if (jThemeConfig == nullptr) {
        AGENUI_LOG("[JNI] loadThemeConfig: themeConfig is null");
        return JNI_FALSE;
    }
    IAGenUIEngine *engine = getAGenUIEngine();
    if (!engine) {
        AGENUI_LOG("[JNI] loadThemeConfig: engine is null");
        return JNI_FALSE;
    }
    ScopedUtfChars themeConfigObj(env, jThemeConfig);
    std::string themeConfig = themeConfigObj.c_str();
    std::string result;
    AGENUI_LOG("[JNI] loadThemeConfig");
    bool success = engine->loadThemeConfig(themeConfig, result);
    if (!success) {
        AGENUI_LOG("[JNI] loadThemeConfig failed: %s", result.c_str());
    }
    return success ? JNI_TRUE : JNI_FALSE;
}

static jboolean jni_loadDesignTokenConfig(JNIEnv* env, jclass clazz, jstring jDesignTokenConfig) {
    if (jDesignTokenConfig == nullptr) {
        AGENUI_LOG("[JNI] loadDesignTokenConfig: designTokenConfig is null");
        return JNI_FALSE;
    }
    IAGenUIEngine *engine = getAGenUIEngine();
    if (!engine) {
        AGENUI_LOG("[JNI] loadDesignTokenConfig: engine is null");
        return JNI_FALSE;
    }
    ScopedUtfChars designTokenConfigObj(env, jDesignTokenConfig);
    std::string designTokenConfig = designTokenConfigObj.c_str();
    std::string result;
    AGENUI_LOG("[JNI] loadDesignTokenConfig");
    bool success = engine->loadDesignTokenConfig(designTokenConfig, result);
    if (!success) {
        AGENUI_LOG("[JNI] loadDesignTokenConfig failed: %s", result.c_str());
    }
    return success ? JNI_TRUE : JNI_FALSE;
}

static void jni_setDayNightMode(JNIEnv* env, jclass clazz, jstring jMode) {
    if (jMode == nullptr) {
        AGENUI_LOG("[JNI] setDayNightMode: mode is null");
        return;
    }
    IAGenUIEngine *engine = getAGenUIEngine();
    if (!engine) {
        AGENUI_LOG("[JNI] setDayNightMode: engine is null");
        return;
    }
    ScopedUtfChars modeObj(env, jMode);
    std::string mode = modeObj.c_str();
    AGENUI_LOG("[JNI] setDayNightMode: mode=%s", mode.c_str());
    engine->setDayNightMode(mode);
}

static void jni_registerFunction(JNIEnv* env, jclass clazz, jstring jName, jstring jConfig, jobject javaFunction) {
    if (jName == nullptr || jConfig == nullptr || javaFunction == nullptr) {
        AGENUI_LOG("[JNI] registerFunction: invalid params");
        return;
    }

    IAGenUIEngine *engine = getAGenUIEngine();
    if (!engine) {
        AGENUI_LOG("[JNI] registerFunction: engine is null");
        return;
    }

    ScopedUtfChars nameObj(env, jName);
    std::string name = nameObj.c_str();

    ScopedUtfChars configObj(env, jConfig);
    std::string config = configObj.c_str();

    auto* function = new AndroidPlatformFunction(env, javaFunction);

    bool registered = engine->registerFunction(config, function);
    if (!registered) {
        // Registration failed: engine did not take ownership, release here to avoid leak
        AGENUI_LOG("[JNI] registerFunction: engine reject, release function, name=%s", name.c_str());
        delete function;
        return;
    }

    // Record in JNI-layer map only after successful registration, for lifecycle management
    {
        std::lock_guard<std::mutex> lock(sPlatformFunctionsMutex);
        auto it = sPlatformFunctions.find(name);
        if (it != sPlatformFunctions.end()) {
            // Old function was overridden in the engine layer; safely release the old instance
            delete it->second;
        }
        sPlatformFunctions[name] = function;
    }

    AGENUI_LOG("[JNI] registerFunction: name=%s", name.c_str());
}

static void jni_onAsyncCallbackResult(JNIEnv* env, jclass clazz, jlong callbackPtr,
                                       jint status, jstring jData, jstring jError) {
    auto* callback = reinterpret_cast<FunctionCallCallback*>(callbackPtr);
    if (callback == nullptr) {
        AGENUI_LOG("[JNI] onAsyncCallbackResult: callback is null");
        return;
    }

    // Double-invoke guard: check and consume the callback pointer
    if (!consumeAsyncCallback(callback)) {
        AGENUI_LOG("[JNI] onAsyncCallbackResult: callback already consumed or invalid, ptr=%lld",
                   (long long)callbackPtr);
        return;
    }

    FunctionCallResult result;
    result.status = static_cast<FunctionCallStatus>(status);

    if (jData != nullptr) {
        ScopedUtfChars dataChars(env, jData);
        result.data = dataChars.c_str();
    }
    if (jError != nullptr) {
        ScopedUtfChars errorChars(env, jError);
        result.error = errorChars.c_str();
    }

    (*callback)(result);
    delete callback;  // one-shot callback, release after use
}

static void jni_unregisterFunction(JNIEnv* env, jclass clazz, jstring jName) {
    if (jName == nullptr) {
        AGENUI_LOG("[JNI] unregisterFunction: name is null");
        return;
    }
    IAGenUIEngine *engine = getAGenUIEngine();
    if (!engine) {
        AGENUI_LOG("[JNI] unregisterFunction: engine is null");
        return;
    }
    ScopedUtfChars nameObj(env, jName);
    std::string name = nameObj.c_str();
    AGENUI_LOG("[JNI] unregisterFunction: name=%s", name.c_str());
    bool unregistered = engine->unregisterFunction(name);

    // Only destroy the JNI-layer instance after the engine successfully unregisters it
    if (!unregistered) {
        AGENUI_LOG("[JNI] unregisterFunction: engine not registered, skip destroy, name=%s", name.c_str());
        return;
    }
    {
        std::lock_guard<std::mutex> lock(sPlatformFunctionsMutex);
        auto it = sPlatformFunctions.find(name);
        if (it != sPlatformFunctions.end()) {
            delete it->second;
            sPlatformFunctions.erase(it);
            AGENUI_LOG("[JNI] unregisterFunction: destroyed AndroidPlatformFunction for %s", name.c_str());
        }
    }
}

jint register_jni_AGenUIEngine(JNIEnv* env) {
    AGENUI_LOG("[JNI] register_jni_AGenUIEngine");
    // Register all methods for AGenUI class
    ScopedLocalRef<jclass> engineClz(env, env->FindClass("com/amap/agenui/AGenUI"));
    if (engineClz.get() == nullptr) {
        AGENUI_LOG("[JNI] register_jni_AGenUIEngine: AGenUI class not found");
        return JNI_ERR;
    }
    
    JNINativeMethod nativeMethods[] = {
        // Engine lifecycle
        {"nativeInitAGenUIEngine", "()J", (void *) jni_initAGenUIEngine},
        {"nativeDestroyAGenUIEngine", "()V", (void *) jni_destroyAGenUIEngine},
        // SurfaceManager lifecycle
        {"nativeCreateSurfaceManager", "()I", (void *) jni_createSurfaceManager},
        {"nativeDestroySurfaceManager", "(I)V", (void *) jni_destroySurfaceManager},
        // Engine-level methods
        {"nativeSetWorkdir", "(Ljava/lang/String;)V", (void*)jni_setWorkdir},
        {"nativeLoadThemeConfig", "(Ljava/lang/String;)Z", (void*)jni_loadThemeConfig},
        {"nativeLoadDesignTokenConfig", "(Ljava/lang/String;)Z", (void*)jni_loadDesignTokenConfig},
        {"nativeSetDayNightMode", "(Ljava/lang/String;)V", (void*)jni_setDayNightMode},
        // Function registration
        {"nativeRegisterFunction", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Object;)V", (void*)jni_registerFunction},
        {"nativeUnregisterFunction", "(Ljava/lang/String;)V", (void*)jni_unregisterFunction},
        // Async callback
        {"nativeOnAsyncCallbackResult", "(JILjava/lang/String;Ljava/lang/String;)V", (void*)jni_onAsyncCallbackResult},
    };
    
    jint result = env->RegisterNatives(engineClz.get(), nativeMethods, sizeof(nativeMethods) / sizeof(nativeMethods[0]));
    if (result != JNI_OK) {
        AGENUI_LOG("[JNI] register_jni_AGenUIEngine: RegisterNatives failed");
        return JNI_ERR;
    }
    
    return JNI_OK;
}

}
