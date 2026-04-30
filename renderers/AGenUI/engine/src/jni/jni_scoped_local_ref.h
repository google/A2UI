/*
 * Copyright (C) 2010 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Derived from Android AOSP ScopedLocalRef.
 */

#pragma once

#include <jni.h>
#include <cstddef>

namespace agenui {

/**
 * @brief RAII wrapper for JNI local references.
 *
 * Ensures that the local reference is deleted when the ScopedLocalRef
 * goes out of scope.
 *
 * @tparam T JNI reference type (jobject, jclass, jstring, jarray, etc.)
 */
template <typename T>
class ScopedLocalRef {
public:
    ScopedLocalRef(JNIEnv* env, T localRef)
        : _env(env), _localRef(localRef) {
    }

    ~ScopedLocalRef() {
        reset();
    }

    /// Disallow copy
    ScopedLocalRef(const ScopedLocalRef&) = delete;
    ScopedLocalRef& operator=(const ScopedLocalRef&) = delete;

    /// Allow move
    ScopedLocalRef(ScopedLocalRef&& other) noexcept
        : _env(other._env), _localRef(other._localRef) {
        other._localRef = nullptr;
    }

    ScopedLocalRef& operator=(ScopedLocalRef&& other) noexcept {
        if (this != &other) {
            reset();
            _env = other._env;
            _localRef = other._localRef;
            other._localRef = nullptr;
        }
        return *this;
    }

    /**
     * @brief Delete the held reference and set to nullptr.
     */
    void reset() {
        if (_localRef != nullptr) {
            _env->DeleteLocalRef(_localRef);
            _localRef = nullptr;
        }
    }

    /**
     * @brief Release ownership and return the raw reference without deleting.
     */
    T release() {
        T ref = _localRef;
        _localRef = nullptr;
        return ref;
    }

    /**
     * @brief Get the raw JNI local reference.
     */
    T get() const {
        return _localRef;
    }

private:
    JNIEnv* _env;
    T _localRef;
};

} // namespace agenui
