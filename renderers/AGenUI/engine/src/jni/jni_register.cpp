#include "jni_register.h"
#include "jni_helper.h"

namespace agenui {

extern jint register_jni_AGenUIEngine(JNIEnv* env);
extern jint register_jni_AGenUISurfaceManager(JNIEnv* env);

#if defined(__cplusplus)
extern "C" {
#endif

void registerAGenUIMain(JNIEnv *env) {
    register_jni_AGenUIEngine(env);
    register_jni_AGenUISurfaceManager(env);
}

void unregisterAGenUIMain(JNIEnv *env) {
}

#if defined(__cplusplus)
}
#endif

bool JNIRegister::registerNatives(JNIEnv *env) {
    // Obtain JavaVM from JNIEnv and store it
    JavaVM* vm = nullptr;
    if (env->GetJavaVM(&vm) == JNI_OK && vm != nullptr) {
        JNIHelper::setJavaVM(vm);
    }

    registerAGenUIMain(env);
    return true;
}

bool JNIRegister::unregisterNatives(JNIEnv *env) {
    unregisterAGenUIMain(env);
    return true;
}

}
