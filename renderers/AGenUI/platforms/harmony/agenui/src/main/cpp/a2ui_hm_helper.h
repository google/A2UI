#pragma once

#include <hilog/log.h>
#include <napi/native_api.h>
#include <js_native_api.h>
#include <vector>
#include <string>
#include <nlohmann/json.hpp>
#include "a2ui_api.h"
#include "hilog/log.h"
#include "log/a2ui_capi_log.h"

namespace a2ui {

// Size (in bytes) of the small stack buffer used to format short NAPI error messages
// such as "napi_status: <code>". 256 bytes comfortably fits all such formatted strings.
constexpr size_t kNapiErrorMessageBufferSize = 256;
class HMHelper {
public:
    /**
     * Call a method on the referenced ArkTS object.
     */    
    template <typename... Args>
    static napi_value callArkTSObjectFunction(const ArkTSObject& obj, const std::string& funcName, const Args&... args);
    
    /**
     * Call a global ArkTS function.
     */    
    template <typename... Args>
    static napi_value callArkTSFunction(const ArkTSObject& f, const Args&... args);
    
    /**
     * Release an ArkTS object reference.
     */    
    static void deleteReference(const ArkTSObject& obj);
    
    /**
     * Check whether the value is a JavaScript function.
     */    
    static bool isJsFunction(napi_env env, napi_value value);

    /**
     * Look up a function registered through the API below.
     *
     */    
    static ArkTSObject ref(const std::string& name);
    
    /**
     * Return extra diagnostics when status is not napi_ok.
     */
    static std::string handle_unexpected_status(napi_env env, napi_status status);  
};

class VariableConversion {
private:
    static bool isObjectValid(napi_env env, napi_value object) {
        if (!object || !env) {
            return false;
        }
        
        napi_valuetype type = napi_undefined;
        napi_status status = napi_typeof(env, object, &type);
//        RELEASE_ASSERT_WITHLOG(status == napi_ok, "unexpected napi_status: %s", HMHelper::handle_unexpected_status(env, status).c_str());
        if (type == napi_undefined || type == napi_null) {
            return false;
        }
        
        return true;
    }
    
    static napi_value getObjectProperty(napi_env env, napi_value object, const std::string& propertyName) {
        napi_value result = nullptr;
        napi_status status = napi_get_named_property(env, object, propertyName.c_str(), &result);
//        RELEASE_ASSERT_WITHLOG(status == napi_ok, "unexpected napi_status: %s", HMHelper::handle_unexpected_status(env, status).c_str());
        return result;
    }
    
    static napi_value getGlobalProperty(napi_env env, const std::string& propertyName) {
        napi_status status;
        napi_value globalObject = nullptr;
        status = napi_get_global(env, &globalObject);
        if (status != napi_ok) {
            return nullptr;
        }
        return getObjectProperty(env, globalObject, propertyName);
    }
    
    static napi_value getGlobalObjectFunction(napi_env env, const std::string& objectName, const std::string& functionName) {
        napi_value object = getGlobalProperty(env, objectName);
//        RELEASE_ASSERT_WITHLOG(object != nullptr, "cannot get %s from global", objectName.c_str());
        napi_value result = getObjectProperty(env, object, functionName);
//        RELEASE_ASSERT_WITHLOG(result != nullptr, "cannot get %s from %s", functionName.c_str(), objectName.c_str());
        napi_valuetype type = napi_valuetype::napi_null;
        napi_status status = napi_typeof(env, result, &type);
        if (status != napi_ok || type != napi_function) {
            return nullptr;
        }
        
        return result;
    }
    
    static napi_value invokeFunction(napi_env env, napi_value object, const std::string& functionName, size_t arg_count, napi_value* args) {
        napi_value function = getObjectProperty(env, object, functionName);
        napi_status status = napi_ok;
        napi_valuetype type;
        status = napi_typeof(env, function, &type);
//        RELEASE_ASSERT_WITHLOG(status == napi_ok, "unexpected napi_status: %s", HMHelper::handle_unexpected_status(env, status).c_str());
        if (type != napi_function) {
            return nullptr;
        }
        napi_value result;
        status = napi_call_function(env, object, function, arg_count, args, &result);
//        RELEASE_ASSERT_WITHLOG(status == napi_ok, "unexpected napi_status: %s", HMHelper::handle_unexpected_status(env, status).c_str());
        return result;
    }

    static std::string JSON_stringify(napi_env env, napi_value object) {
        napi_value stringifyFunction = getGlobalObjectFunction(env, "JSON", "stringify");
        if (!stringifyFunction) {
            return "";
        }
        napi_status status;
        napi_value jsonString = nullptr;
        napi_value argv[1];
        argv[0] = object;
        status = napi_call_function(env, nullptr, stringifyFunction, 1, argv, &jsonString);
        size_t stringSize = 0;
        status = napi_get_value_string_utf8(env, jsonString, nullptr, 0, &stringSize);
        std::vector<char> buffer(stringSize + 1, 0);
        status  = napi_get_value_string_utf8(env, jsonString, buffer.data(), buffer.size(), &stringSize);
        return buffer.data();
    }
    
    static napi_value JSON_parse(napi_env env, const std::string& jsonString) {
        // Step 1: create the JS string argument.
        napi_value etsString = nullptr;
        napi_status status = napi_create_string_utf8(env, jsonString.c_str(), jsonString.size(), &etsString);
        if (status != napi_ok || etsString == nullptr) {
            HM_LOGE("[JSON_parse] napi_create_string_utf8 failed: status=%d, input='%.64s'", status, jsonString.c_str());
            napi_value null_result;
            napi_get_null(env, &null_result);
            return null_result;
        }

        // Step 2: look up JSON.parse from the global object.
        napi_value parseFunction = getGlobalObjectFunction(env, "JSON", "parse");
        if (parseFunction == nullptr) {
            HM_LOGE("[JSON_parse] failed to resolve JSON.parse from global");
            napi_value null_result;
            napi_get_null(env, &null_result);
            return null_result;
        }

        // Step 3: invoke JSON.parse(jsonString).
        napi_value result = nullptr;
        napi_value argv[1] = {etsString};
        status = napi_call_function(env, nullptr, parseFunction, 1, argv, &result);
        if (status != napi_ok || result == nullptr) {
            HM_LOGE("[JSON_parse] napi_call_function failed: status=%d, input='%.64s'", status, jsonString.c_str());
            napi_value null_result;
            napi_get_null(env, &null_result);
            return null_result;
        }

        return result;
    }
    
    static bool napiIsMap(napi_env env, napi_value value) {
        napi_value mapConstructor = getGlobalProperty(env, "Map");
        if (!isObjectValid(env, mapConstructor)){
            return false;
        }
        bool isMap = false;
        napi_instanceof(env, value, mapConstructor, &isMap);
        return isMap;
    }
    
public:
    
    static void toNapiValue(napi_env env, napi_value t, napi_value* result) {
        *result = t;
    }
    
    static void toNapiValue(napi_env env, double t, napi_value* result) {
        napi_create_double(env, t, result);
    }
    
    static void toNapiValue(napi_env env, float t, napi_value* result) {
        napi_create_double(env, t, result);
    }
    
    static void toNapiValue(napi_env env, uint32_t t, napi_value* result) {
        napi_create_uint32(env, t, result);
    }
    
    static void toNapiValue(napi_env env, int32_t t, napi_value* result) {
        napi_create_int32(env, t, result);
    }
    
    static void toNapiValue(napi_env env, uint64_t t, napi_value* result) {
        napi_create_bigint_uint64(env, t, result);
    }
    
    // int64_t is long
    static void toNapiValue(napi_env env, int64_t t, napi_value* result) {
        napi_create_bigint_int64(env, t, result);
    }

    static void toNapiValue(napi_env env, long long t, napi_value* result) {
        napi_create_bigint_int64(env, t, result);
    }

    static void toNapiValue(napi_env env, void* t, napi_value* result) {
        napi_create_bigint_uint64(env, reinterpret_cast<uint64_t>(t), result);
    }
    
    static void toNapiValue(napi_env env, const char* t, napi_value* result) {
        napi_create_string_utf8(env, t, t ? strlen(t) : 0, result);
    }
    
    static void toNapiValue(napi_env env, const std::string& t, napi_value* result) {
        napi_create_string_utf8(env, t.c_str(), t.size(), result);
    }
    
    static void toNapiValue(napi_env env, const napi_ref& ref, napi_value* result) {
        napi_get_reference_value(env, ref, result);
    }
    
    // Overload for nlohmann::json.
    static void toNapiValue(napi_env env, const nlohmann::json& t, napi_value* result) {
        // Convert the JSON object to a string and feed it through JSON.parse.
        std::string jsonStr = t.dump();
        *result = JSON_parse(env, jsonStr);
    }
    template <typename T>
    static void toNapiValue(napi_env env, const std::vector<T>& t, napi_value* result) {
        napi_create_array_with_length(env, t.size(), result);
        for (size_t i = 0; i < t.size(); ++i) {
            napi_value value;
            toNapiValue(env, t[i], &value);
            auto status = napi_set_element(env, *result, i, value);
//            RELEASE_ASSERT_WITHLOG(status == napi_ok, "%s", HMHelper::handle_unexpected_status(env,status).c_str());
        }
    }
    
    // Convert a variadic argument list to napi_value instances.
    template <typename... Args>
    static void convert(napi_env env, std::vector<napi_value>& result, const Args&... args) {
        toNapiHelper(env, result, args...);
    }
    
private:
    static void toNapiHelper(napi_env env, std::vector<napi_value>&) {
    }

    template <typename T, typename... Args>
    static void toNapiHelper(napi_env env, std::vector<napi_value>& result, const T& arg, const Args&... args) {
        napi_value v;
        toNapiValue(env, arg, &v);
        result.push_back(v);
        toNapiHelper(env, result, args...); // Recurse through the remaining arguments.
    }
    
//     static JsValue getMapFromJS(napi_env env, napi_value js_object);
    
};

// Template implementations
template <typename... Args>
inline napi_value HMHelper::callArkTSObjectFunction(const ArkTSObject& obj, const std::string& funcName, const Args&... args) {
    std::vector<napi_value> v;
    VariableConversion::convert(obj.env, v, args...);
    
    napi_value object;
    napi_get_reference_value(obj.env, obj.ref, &object);

    napi_status status;
    napi_value method = nullptr;
    napi_value key = nullptr;
    status = napi_create_string_utf8(obj.env, funcName.c_str(), NAPI_AUTO_LENGTH, &key);
    if (status != napi_ok || key == nullptr) {
        return nullptr;
    }

    status = napi_get_property(obj.env, object, key, &method);
    if (status != napi_ok || method == nullptr) {
        return nullptr;
    }

    napi_value result;
    status = napi_call_function(obj.env, object, method, v.size(), v.data(), &result);
    if (status != napi_ok) {
        return nullptr;
    }
    return result;        
}

template <typename... Args>
inline napi_value HMHelper::callArkTSFunction(const ArkTSObject& f, const Args&... args) {
    std::vector<napi_value> v;
    VariableConversion::convert(f.env, v, args...);
    napi_value result;
    napi_value func;
    if (napi_ok != napi_get_reference_value(f.env, f.ref, &func)) {
        return nullptr;
    }
    napi_status ret = napi_call_function(f.env, nullptr, func, v.size(), v.data(), &result);
    if (ret != napi_ok) {
        std::string str = HMHelper::handle_unexpected_status(f.env, ret).c_str();
        HM_LOGD("sxl-unexpected napi_status: %s", str.c_str());
        return nullptr;
    }
    return result;
}

inline void HMHelper::deleteReference(const ArkTSObject& obj) {
    napi_delete_reference(obj.env, obj.ref);
}

inline bool HMHelper::isJsFunction(napi_env env, napi_value value) {
    napi_valuetype type = napi_undefined;
    napi_status status = napi_typeof(env, value, &type);
    if (status != napi_ok) {
        return false;
    }
    return type == napi_function;
}

extern a2ui::IHarmonyNAPI* implHarmonyNAPI();
inline ArkTSObject HMHelper::ref(const std::string& name) {
    auto ptr = implHarmonyNAPI();
    if (ptr) {
        return ptr->ref(name);
    }
    return ArkTSObject{nullptr, nullptr};
}

inline std::string HMHelper::handle_unexpected_status(napi_env env, napi_status status) {
    if (status == napi_ok) {
        return "";
    }

    napi_value last_exception;
    napi_status invoke_status = napi_get_and_clear_last_exception(env, &last_exception);
    if (invoke_status != napi_ok || last_exception == nullptr) {
        char buf[kNapiErrorMessageBufferSize] = {0};
        snprintf(buf, sizeof(buf), "napi_status: %d", status);
        return buf;
    }
        
    napi_value error_message_key;
    invoke_status = napi_create_string_utf8(env, "message", NAPI_AUTO_LENGTH, &error_message_key);
    if (invoke_status != napi_ok || error_message_key == nullptr) {
        char buf[kNapiErrorMessageBufferSize] = {0};
        snprintf(buf, sizeof(buf), "napi_status: %d", status);
        return buf;
    }
        
    napi_value error_stack_key;
    invoke_status = napi_create_string_utf8(env, "stack", NAPI_AUTO_LENGTH, &error_stack_key);
    if (invoke_status != napi_ok || error_stack_key == nullptr) {
        char buf[kNapiErrorMessageBufferSize] = {0};
        snprintf(buf, sizeof(buf), "napi_status: %d", status);
        return buf;
    }
        
    napi_value error_message;
    invoke_status = napi_get_property(env, last_exception, error_message_key, &error_message);
    if (invoke_status != napi_ok || error_message == nullptr) {
        char buf[kNapiErrorMessageBufferSize] = {0};
        snprintf(buf, sizeof(buf), "napi_status: %d", status);
        return buf;
    }
        
    napi_value error_stack;
    invoke_status = napi_get_property(env, last_exception, error_stack_key, &error_stack);
    if (invoke_status != napi_ok || error_stack == nullptr) {
        char buf[kNapiErrorMessageBufferSize] = {0};
        snprintf(buf, sizeof(buf), "napi_status: %d", status);
        return buf;
    }
        
    std::string out;
    out.append("pending exception: ");
    
    // Read the message field.
    size_t msg_len = 0;
    invoke_status = napi_get_value_string_utf8(env, error_message, nullptr, 0, &msg_len);
    if (invoke_status == napi_ok && msg_len > 0) {
        std::vector<char> msg_buf(msg_len + 1);
        napi_get_value_string_utf8(env, error_message, msg_buf.data(), msg_buf.size(), &msg_len);
        out.append("message:");
        out.append(msg_buf.data());
    }
    
    // Read the stack field.
    size_t stack_len = 0;
    invoke_status = napi_get_value_string_utf8(env, error_stack, nullptr, 0, &stack_len);
    if (invoke_status == napi_ok && stack_len > 0) {
        std::vector<char> stack_buf(stack_len + 1);
        napi_get_value_string_utf8(env, error_stack, stack_buf.data(), stack_buf.size(), &stack_len);
        out.append(" stack:");
        out.append(stack_buf.data());
    }
    
    return out;
}

}
