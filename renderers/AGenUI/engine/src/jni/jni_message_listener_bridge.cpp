#include "jni_message_listener_bridge.h"
#include "jni_scoped_local_ref.h"
#include "jni_scoped_utf_chars.h"
#include "agenui_log.h"
#include <sstream>

namespace agenui {

class JNIEnvGuard {
public:
    explicit JNIEnvGuard(JavaVM* jvm) : _jvm(jvm), _env(nullptr), _needsDetach(false) {
        if (!_jvm) return;
        jint result = _jvm->GetEnv((void**)&_env, JNI_VERSION_1_6);
        if (result == JNI_OK) {
            return;
        }
        if (result == JNI_EDETACHED) {
            AGENUI_LOG("[JNIEnvGuard] Thread not attached, attaching...");
            if (_jvm->AttachCurrentThread(&_env, nullptr) == JNI_OK) {
                _needsDetach = true;
            } else {
                AGENUI_LOG("[JNIEnvGuard] AttachCurrentThread failed");
                _env = nullptr;
            }
        } else {
            AGENUI_LOG("[JNIEnvGuard] GetEnv failed with result: %d", result);
        }
    }
    ~JNIEnvGuard() {
        if (_needsDetach && _jvm) {
            _jvm->DetachCurrentThread();
        }
    }
    JNIEnv* env() const { return _env; }
    JNIEnvGuard(const JNIEnvGuard&) = delete;
    JNIEnvGuard& operator=(const JNIEnvGuard&) = delete;
private:
    JavaVM* _jvm;
    JNIEnv* _env;
    bool _needsDetach;
};

JNIMessageListenerBridge::JNIMessageListenerBridge(JNIEnv* env, jobject javaListener)
    : _jvm(nullptr), _javaListener(nullptr), _onCreateSurfaceMethod(nullptr),
      _onUpdateComponentsMethod(nullptr), _onDeleteSurfaceMethod(nullptr) {

    env->GetJavaVM(&_jvm);

    _javaListener = env->NewGlobalRef(javaListener);

    ScopedLocalRef<jclass> listenerClass(env, env->GetObjectClass(javaListener));
    if (listenerClass.get() == nullptr) {
        AGENUI_LOG("JNIMessageListenerBridge: failed to get listener class");
        return;
    }

    // Cache method IDs
    _onCreateSurfaceMethod = env->GetMethodID(listenerClass.get(), "onCreateSurface", "(Ljava/lang/String;Ljava/lang/String;Ljava/util/Map;ZZ)V");
    _onUpdateComponentsMethod = env->GetMethodID(listenerClass.get(), "onUpdateComponents", "(Ljava/lang/String;[Ljava/lang/String;)V");
    _onDeleteSurfaceMethod = env->GetMethodID(listenerClass.get(), "onDeleteSurface", "(Ljava/lang/String;)V");
    _onInteractionStatusEvent = env->GetMethodID(listenerClass.get(), "onInteractionStatusEvent", "(ILjava/lang/String;)V");
    _onActionEventRouted = env->GetMethodID(listenerClass.get(), "onActionEventRouted", "(Ljava/lang/String;)V");
    
    if (_onCreateSurfaceMethod == nullptr || _onUpdateComponentsMethod == nullptr || _onDeleteSurfaceMethod == nullptr || _onInteractionStatusEvent == nullptr || _onActionEventRouted == nullptr) {
        AGENUI_LOG("JNIMessageListenerBridge: failed to get method IDs");
    }
}

JNIMessageListenerBridge::~JNIMessageListenerBridge() {
    if (_javaListener != nullptr && _jvm != nullptr) {
        JNIEnvGuard envGuard(_jvm);
        JNIEnv* env = envGuard.env();
        if (env != nullptr) {
            env->DeleteGlobalRef(_javaListener);
        }
    }
}

void JNIMessageListenerBridge::onCreateSurface(const CreateSurfaceMessage& msg) {
    if (_jvm == nullptr || _javaListener == nullptr || _onCreateSurfaceMethod == nullptr) {
        return;
    }
    
    JNIEnvGuard envGuard(_jvm);
    JNIEnv* env = envGuard.env();
    if (env == nullptr) {
        AGENUI_LOG("[JNI] onCreateSurface: failed to acquire JNIEnv");
        return;
    }
    
    ScopedLocalRef<jstring> jSurfaceId(env, env->NewStringUTF(msg.surfaceId.c_str()));
    ScopedLocalRef<jstring> jCatalogId(env, env->NewStringUTF(msg.catalogId.c_str()));
    ScopedLocalRef<jobject> jTheme(env, createJavaHashMap(env, msg.theme));
    jboolean jSendDataModel = msg.sendDataModel ? JNI_TRUE : JNI_FALSE;
    jboolean jAnimated = msg.animated ? JNI_TRUE : JNI_FALSE;

    env->CallVoidMethod(_javaListener, _onCreateSurfaceMethod, jSurfaceId.get(), jCatalogId.get(), jTheme.get(), jSendDataModel, jAnimated);
}

void JNIMessageListenerBridge::onUpdateComponents(const UpdateComponentsMessage& msg) {
    AGENUI_LOG("-JNI- 1 onUpdateComponents, surfaceId=%s", msg.surfaceId.c_str());
    if (_jvm == nullptr || _javaListener == nullptr || _onUpdateComponentsMethod == nullptr) {
        return;
    }

    AGENUI_LOG("-JNI- 2 onUpdateComponents, surfaceId=%s", msg.surfaceId.c_str());
    
    JNIEnvGuard envGuard(_jvm);
    JNIEnv* env = envGuard.env();
    if (env == nullptr) {
        AGENUI_LOG("[JNI] onUpdateComponents: failed to acquire JNIEnv");
        return;
    }
    
    ScopedLocalRef<jstring> jSurfaceId(env, env->NewStringUTF(msg.surfaceId.c_str()));

    ScopedLocalRef<jclass> stringClass(env, env->FindClass("java/lang/String"));
    if (stringClass.get() == nullptr) {
        return;
    }
    
    ScopedLocalRef<jobjectArray> jComponentsArray(env, env->NewObjectArray(static_cast<jsize>(msg.components.size()), stringClass.get(), nullptr));
    if (jComponentsArray.get() == nullptr) {
        return;
    }
    
    for (size_t i = 0; i < msg.components.size(); ++i) {
        ScopedLocalRef<jstring> jComponent(env, env->NewStringUTF(msg.components[i].c_str()));
        env->SetObjectArrayElement(jComponentsArray.get(), static_cast<jsize>(i), jComponent.get());
    }
    
    env->CallVoidMethod(_javaListener, _onUpdateComponentsMethod, jSurfaceId.get(), jComponentsArray.get());
}

void JNIMessageListenerBridge::onDeleteSurface(const DeleteSurfaceMessage& msg) {
    if (_jvm == nullptr || _javaListener == nullptr || _onDeleteSurfaceMethod == nullptr) {
        return;
    }

    JNIEnvGuard envGuard(_jvm);
    JNIEnv* env = envGuard.env();
    if (env == nullptr) {
        AGENUI_LOG("[JNI] onDeleteSurface: failed to acquire JNIEnv");
        return;
    }

    ScopedLocalRef<jstring> jSurfaceId(env, env->NewStringUTF(msg.surfaceId.c_str()));

    env->CallVoidMethod(_javaListener, _onDeleteSurfaceMethod, jSurfaceId.get());
}

void JNIMessageListenerBridge::onInteractionStatusEvent(int32_t eventType, const std::string &content) {
    if (_jvm == nullptr || _javaListener == nullptr || _onInteractionStatusEvent == nullptr) {
        return;
    }

    JNIEnvGuard envGuard(_jvm);
    JNIEnv* env = envGuard.env();
    if (env == nullptr) {
        AGENUI_LOG("[JNI] onInteractionStatusEvent: failed to acquire JNIEnv");
        return;
    }

    ScopedLocalRef<jstring> jContent(env, env->NewStringUTF(content.c_str()));

    env->CallVoidMethod(_javaListener, _onInteractionStatusEvent, eventType, jContent.get());
}

void JNIMessageListenerBridge::onActionEventRouted(const std::string &content) {
    if (_jvm == nullptr || _javaListener == nullptr || _onActionEventRouted == nullptr) {
        return;
    }

    JNIEnvGuard envGuard(_jvm);
    JNIEnv* env = envGuard.env();
    if (env == nullptr) {
        AGENUI_LOG("[JNI] onActionEventRouted: failed to acquire JNIEnv");
        return;
    }

    ScopedLocalRef<jstring> jContent(env, env->NewStringUTF(content.c_str()));

    env->CallVoidMethod(_javaListener, _onActionEventRouted, jContent.get());
}

jobject JNIMessageListenerBridge::createJavaHashMap(JNIEnv* env, const std::map<std::string, std::string>& map) {
    ScopedLocalRef<jclass> hashMapClass(env, env->FindClass("java/util/HashMap"));
    if (hashMapClass.get() == nullptr) {
        return nullptr;
    }
    
    jmethodID hashMapConstructor = env->GetMethodID(hashMapClass.get(), "<init>", "()V");
    if (hashMapConstructor == nullptr) {
        return nullptr;
    }
    
    ScopedLocalRef<jobject> hashMap(env, env->NewObject(hashMapClass.get(), hashMapConstructor));
    if (hashMap.get() == nullptr) {
        return nullptr;
    }
    
    jmethodID putMethod = env->GetMethodID(hashMapClass.get(), "put", "(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;");
    if (putMethod == nullptr) {
        return nullptr;
    }
    
    for (const auto& pair : map) {
        ScopedLocalRef<jstring> jKey(env, env->NewStringUTF(pair.first.c_str()));
        ScopedLocalRef<jstring> jValue(env, env->NewStringUTF(pair.second.c_str()));
        env->CallObjectMethod(hashMap.get(), putMethod, jKey.get(), jValue.get());
    }
    
    return env->NewLocalRef(hashMap.get());
}

ListenerBridgeManager& ListenerBridgeManager::getInstance() {
    static ListenerBridgeManager instance;
    return instance;
}

void ListenerBridgeManager::addMapping(JNIEnv* env, jobject javaListener, JNIMessageListenerBridge* bridge) {
    std::lock_guard<std::mutex> lock(_mutex);
    jobject globalRef = env->NewGlobalRef(javaListener);
    _listenerMap[globalRef] = bridge;
}

JNIMessageListenerBridge* ListenerBridgeManager::findBridge(JNIEnv* env, jobject javaListener) {
    std::lock_guard<std::mutex> lock(_mutex);
    for (const auto& pair : _listenerMap) {
        if (env->IsSameObject(pair.first, javaListener)) {
            return pair.second;
        }
    }
    return nullptr;
}

void ListenerBridgeManager::removeMapping(JNIEnv* env, jobject javaListener) {
    std::lock_guard<std::mutex> lock(_mutex);
    for (auto it = _listenerMap.begin(); it != _listenerMap.end(); ++it) {
        if (env->IsSameObject(it->first, javaListener)) {
            env->DeleteGlobalRef(it->first);
            _listenerMap.erase(it);
            return;
        }
    }
}

} // namespace agenui
