#ifdef __ANDROID__

#include "jni_android_platform_function.h"
#include "jni_helper.h"
#include "agenui_log.h"
#include "jni/jni_scoped_local_ref.h"
#include "jni/jni_scoped_utf_chars.h"

namespace agenui {

std::mutex sAsyncCallbacksMutex;
std::set<void*> sActiveAsyncCallbacks;

void registerAsyncCallback(void* ptr) {
    std::lock_guard<std::mutex> lock(sAsyncCallbacksMutex);
    sActiveAsyncCallbacks.insert(ptr);
}

bool consumeAsyncCallback(void* ptr) {
    std::lock_guard<std::mutex> lock(sAsyncCallbacksMutex);
    auto it = sActiveAsyncCallbacks.find(ptr);
    if (it == sActiveAsyncCallbacks.end()) {
        return false;
    }
    sActiveAsyncCallbacks.erase(it);
    return true;
}

AndroidPlatformFunction::AndroidPlatformFunction(JNIEnv* env, jobject javaFunction)
    : _jvm(nullptr), _javaFunction(nullptr),
      _callSyncMethod(nullptr), _callAsyncMethod(nullptr) {

    env->GetJavaVM(&_jvm);

    _javaFunction = env->NewGlobalRef(javaFunction);

    ScopedLocalRef<jclass> functionClass(env, env->GetObjectClass(javaFunction));
    if (functionClass.get() == nullptr) {
        AGENUI_LOG("[AndroidPlatformFunction] constructor: failed to get function class");
        return;
    }

    // Cache method IDs
    _callSyncMethod = env->GetMethodID(functionClass.get(), "callSync",
        "(Ljava/lang/String;)Ljava/lang/String;");
    _callAsyncMethod = env->GetMethodID(functionClass.get(), "callAsync",
        "(Ljava/lang/String;J)Ljava/lang/String;");

    if (_callSyncMethod == nullptr || _callAsyncMethod == nullptr) {
        AGENUI_LOG("[AndroidPlatformFunction] constructor: failed to get method IDs");
    }
}

AndroidPlatformFunction::~AndroidPlatformFunction() {
    if (_javaFunction != nullptr && _jvm != nullptr) {
        JNIEnv* env = nullptr;
        _jvm->GetEnv((void**)&env, JNI_VERSION_1_6);
        if (env != nullptr) {
            env->DeleteGlobalRef(_javaFunction);
        }
    }
}

FunctionCallResult AndroidPlatformFunction::callSync(const std::string& params) {
    FunctionCallResult result;
    result.status = FunctionCallStatus::Error;

    JNIEnv* env = JNIHelper::getJNIEnv();
    if (!env) {
        result.error = "Failed to get JNIEnv";
        AGENUI_LOG("[AndroidPlatformFunction] callSync: failed to get JNIEnv");
        return result;
    }

    if (!_callSyncMethod || !_javaFunction) {
        result.error = "Method or function object is null";
        AGENUI_LOG("[AndroidPlatformFunction] callSync: method or object is null");
        return result;
    }

    ScopedLocalRef<jstring> jParams(env, env->NewStringUTF(params.c_str()));

    ScopedLocalRef<jstring> jResult(env, (jstring)env->CallObjectMethod(
        _javaFunction, _callSyncMethod, jParams.get()));

    if (env->ExceptionCheck()) {
        env->ExceptionDescribe();
        env->ExceptionClear();
        result.error = "Exception occurred during callSync";
        AGENUI_LOG("[AndroidPlatformFunction] callSync: exception occurred");
        return result;
    }

    if (jResult.get() == nullptr) {
        result.error = "callSync returned null";
        AGENUI_LOG("[AndroidPlatformFunction] callSync: returned null");
        return result;
    }

    ScopedUtfChars resultChars(env, jResult.get());
    result.status = FunctionCallStatus::Success;
    result.data = resultChars.c_str();
    return result;
}

FunctionCallResult AndroidPlatformFunction::callAsync(const std::string& params,
                                                       const FunctionCallCallback& callback) {
    FunctionCallResult result;
    result.status = FunctionCallStatus::Error;

    JNIEnv* env = JNIHelper::getJNIEnv();
    if (!env) {
        result.error = "Failed to get JNIEnv";
        AGENUI_LOG("[AndroidPlatformFunction] callAsync: failed to get JNIEnv");
        return result;
    }

    if (!_callAsyncMethod || !_javaFunction) {
        result.error = "Method or function object is null";
        AGENUI_LOG("[AndroidPlatformFunction] callAsync: method or object is null");
        return result;
    }

    // Wrap callback as a heap object and pass its pointer to Java via jlong
    auto* callbackPtr = new FunctionCallCallback(callback);
    registerAsyncCallback(callbackPtr);
    jlong jCallbackPtr = reinterpret_cast<jlong>(callbackPtr);

    ScopedLocalRef<jstring> jParams(env, env->NewStringUTF(params.c_str()));

    ScopedLocalRef<jstring> jResult(env, (jstring)env->CallObjectMethod(
        _javaFunction, _callAsyncMethod, jParams.get(), jCallbackPtr));

    if (env->ExceptionCheck()) {
        env->ExceptionDescribe();
        env->ExceptionClear();
        consumeAsyncCallback(callbackPtr);
        delete callbackPtr;
        result.error = "Exception occurred during callAsync";
        AGENUI_LOG("[AndroidPlatformFunction] callAsync: exception occurred");
        return result;
    }

    result.status = FunctionCallStatus::Pending;
    if (jResult.get() != nullptr) {
        ScopedUtfChars resultChars(env, jResult.get());
        result.data = resultChars.c_str();
    }
    return result;
}

} // namespace agenui
#endif
