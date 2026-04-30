#pragma once

#include <jni.h>
namespace agenui {
class JNIRegister {
public:
    static bool registerNatives(JNIEnv *env);

    static bool unregisterNatives(JNIEnv *env);
};
}