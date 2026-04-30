#include "jni_helper.h"
#include "agenui_log.h"

namespace agenui {

JavaVM* JNIHelper::s_javaVM = nullptr;

void JNIHelper::setJavaVM(JavaVM* vm) {
    s_javaVM = vm;
    AGENUI_LOG("[JNIHelper] JavaVM set: %p", vm);
}

JNIEnv* JNIHelper::getJNIEnv() {
    if (s_javaVM == nullptr) {
        AGENUI_LOG("[JNIHelper] JavaVM is null");
        return nullptr;
    }
    
    JNIEnv* env = nullptr;
    jint result = s_javaVM->GetEnv((void**)&env, JNI_VERSION_1_6);
    
    if (result == JNI_OK) {
        return env;
    }

    if (result == JNI_EDETACHED) {
        AGENUI_LOG("[JNIHelper] Thread not attached, attaching...");
        result = s_javaVM->AttachCurrentThread(&env, nullptr);
        if (result != JNI_OK) {
            AGENUI_LOG("[JNIHelper] Failed to attach thread: %d", result);
            return nullptr;
        }
        AGENUI_LOG("[JNIHelper] Thread attached successfully");
        return env;
    }

    AGENUI_LOG("[JNIHelper] GetEnv failed with result: %d", result);
    return nullptr;
}

JavaVM* JNIHelper::getJavaVM() {
    return s_javaVM;
}

} // namespace agenui
