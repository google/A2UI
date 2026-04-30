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
 * Derived from Android AOSP ScopedUtfChars.
 */

#pragma once

#include <jni.h>
#include <cstddef>

namespace agenui {

/**
 * @brief RAII wrapper for JNI GetStringUTFChars / ReleaseStringUTFChars.
 *
 * Automatically converts a jstring to a C-style UTF-8 string on
 * construction, and releases it on destruction.
 */
class ScopedUtfChars {
public:
    ScopedUtfChars(JNIEnv* env, jstring s)
        : _env(env), _string(s), _utfChars(nullptr) {
        if (s != nullptr) {
            _utfChars = env->GetStringUTFChars(s, nullptr);
        }
    }

    ~ScopedUtfChars() {
        if (_utfChars != nullptr) {
            _env->ReleaseStringUTFChars(_string, _utfChars);
        }
    }

    /// Disallow copy
    ScopedUtfChars(const ScopedUtfChars&) = delete;
    ScopedUtfChars& operator=(const ScopedUtfChars&) = delete;

    /**
     * @brief Get the raw C string pointer.
     * @return const char* pointing to the UTF-8 data, or "" if the original jstring was null.
     */
    const char* c_str() const {
        return _utfChars ? _utfChars : "";
    }

    /**
     * @brief Get the length of the UTF-8 string.
     */
    size_t size() const {
        return _utfChars ? static_cast<size_t>(_env->GetStringUTFLength(_string)) : 0;
    }

    /**
     * @brief Check if the underlying string is valid (non-null).
     */
    bool isValid() const {
        return _utfChars != nullptr;
    }

private:
    JNIEnv* _env;
    jstring _string;
    const char* _utfChars;
};

} // namespace agenui
