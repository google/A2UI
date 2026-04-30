#pragma once

#include <jni.h>
#include <map>
#include <mutex>
#include "agenui_message_listener.h"

namespace agenui {

/**
 * @brief JNI message listener bridge
 * @remark Adapts a Java listener to the C++ IAGenUIMessageListener interface
 */
class JNIMessageListenerBridge : public IAGenUIMessageListener {
public:
    JNIMessageListenerBridge(JNIEnv* env, jobject javaListener);
    ~JNIMessageListenerBridge();

    // IAGenUIMessageListener interface
    void onCreateSurface(const CreateSurfaceMessage& msg) override;
    void onUpdateComponents(const UpdateComponentsMessage& msg) override;
    void onDeleteSurface(const DeleteSurfaceMessage& msg) override;
    void onInteractionStatusEvent(int32_t eventType, const std::string &content) override;
    void onActionEventRouted(const std::string &content) override;

    jobject getJavaListener() const { return _javaListener; }

private:
    // Converts a C++ map to a Java HashMap
    jobject createJavaHashMap(JNIEnv* env, const std::map<std::string, std::string>& map);

private:
    JavaVM* _jvm;
    jobject _javaListener;  // global ref
    jmethodID _onCreateSurfaceMethod;
    jmethodID _onUpdateComponentsMethod;
    jmethodID _onDeleteSurfaceMethod;
    jmethodID _onInteractionStatusEvent;
    jmethodID _onActionEventRouted;
};

/**
 * @brief Listener bridge manager
 * @remark Manages the mapping from Java listener objects to C++ bridge objects
 */
class ListenerBridgeManager {
public:
    static ListenerBridgeManager& getInstance();

    void addMapping(JNIEnv* env, jobject javaListener, JNIMessageListenerBridge* bridge);
    JNIMessageListenerBridge* findBridge(JNIEnv* env, jobject javaListener);
    void removeMapping(JNIEnv* env, jobject javaListener);
    
private:
    ListenerBridgeManager() = default;
    ~ListenerBridgeManager() = default;
    
    std::map<jobject, JNIMessageListenerBridge*> _listenerMap;
    std::mutex _mutex;
};

} // namespace agenui
