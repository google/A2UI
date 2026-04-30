#pragma once

#include <jni.h>

namespace agenui {

/**
 * @brief JNI helper class
 *
 * Manages JavaVM and provides JNIEnv access
 */
class JNIHelper {
public:
    /**
     * @brief Set the JavaVM pointer
     * @param vm JavaVM pointer
     */
    static void setJavaVM(JavaVM* vm);

    /**
     * @brief Get the JNIEnv for the current thread
     *
     * Automatically attaches the thread to the JVM if not already attached.
     *
     * @return JNIEnv pointer, or nullptr on failure
     */
    static JNIEnv* getJNIEnv();

    /**
     * @brief Get the JavaVM pointer
     * @return JavaVM pointer
     */
    static JavaVM* getJavaVM();
    
private:
    static JavaVM* s_javaVM;
};

} // namespace agenui
