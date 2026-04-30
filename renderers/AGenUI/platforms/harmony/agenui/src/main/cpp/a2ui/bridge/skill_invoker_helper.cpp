#include "skill_invoker_helper.h"
#include "log/a2ui_capi_log.h"

namespace a2ui {

SkillInvokerHelper& SkillInvokerHelper::getInstance() {
    static SkillInvokerHelper instance;
    return instance;
}

SkillInvokerHelper::~SkillInvokerHelper() {
    clear();
}

void SkillInvokerHelper::registerCallback(napi_env env, napi_value callback) {
    std::lock_guard<std::mutex> lock(mutex_);

    // Clear the previous callback reference
    if (callback_ref_ != nullptr && env_ != nullptr) {
        napi_delete_reference(env_, callback_ref_);
        callback_ref_ = nullptr;
    }

    // Create a new callback reference
    napi_status status = napi_create_reference(env, callback, 1, &callback_ref_);
    if (status != napi_ok) {
        HM_LOGE("SkillInvokerHelper: Failed to create callback reference");
        return;
    }

    env_ = env;
    HM_LOGI("SkillInvokerHelper: Callback registered successfully");
}

std::string SkillInvokerHelper::invokeSkill(const std::string& skillName, const std::string& argsJson) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (env_ == nullptr || callback_ref_ == nullptr) {
        HM_LOGE("SkillInvokerHelper: No callback registered, cannot invoke skill: %s", skillName.c_str());
        return "";
    }

    // Get the callback function
    napi_value callback;
    napi_status status = napi_get_reference_value(env_, callback_ref_, &callback);
    if (status != napi_ok) {
        HM_LOGE("SkillInvokerHelper: Failed to get callback reference value");
        return "";
    }

    // Create the skillName string argument.
    napi_value skillNameArg;
    status = napi_create_string_utf8(env_, skillName.c_str(), NAPI_AUTO_LENGTH, &skillNameArg);
    if (status != napi_ok) {
        HM_LOGE("SkillInvokerHelper: Failed to create skillName string");
        return "";
    }

    // Create the argsJson string argument.
    napi_value argsJsonArg;
    status = napi_create_string_utf8(env_, argsJson.c_str(), NAPI_AUTO_LENGTH, &argsJsonArg);
    if (status != napi_ok) {
        HM_LOGE("SkillInvokerHelper: Failed to create argsJson string");
        return "";
    }

    // Use undefined as this
    napi_value undefined;
    napi_get_undefined(env_, &undefined);

    // Invoke the ArkTS callback: callback(skillName, argsJson) => string.
    napi_value result;
    napi_value args[] = {skillNameArg, argsJsonArg};
    status = napi_call_function(env_, undefined, callback, 2, args, &result);
    if (status != napi_ok) {
        HM_LOGE("SkillInvokerHelper: Failed to call callback for skill: %s", skillName.c_str());
        return "";
    }

    // Check the return type
    napi_valuetype resultType;
    napi_typeof(env_, result, &resultType);
    if (resultType != napi_string) {
        HM_LOGW("SkillInvokerHelper: Callback returned non-string type for skill: %s", skillName.c_str());
        return "";
    }

    // Read the returned string.
    size_t resultLen = 0;
    napi_get_value_string_utf8(env_, result, nullptr, 0, &resultLen);
    char* resultBuf = new char[resultLen + 1];
    napi_get_value_string_utf8(env_, result, resultBuf, resultLen + 1, &resultLen);
    std::string resultStr(resultBuf);
    delete[] resultBuf;

    HM_LOGI("SkillInvokerHelper: Successfully invoked skill: %s, result=%s", skillName.c_str(), resultStr.c_str());
    return resultStr;
}

void SkillInvokerHelper::clear() {
    std::lock_guard<std::mutex> lock(mutex_);

    if (callback_ref_ != nullptr && env_ != nullptr) {
        napi_delete_reference(env_, callback_ref_);
        callback_ref_ = nullptr;
    }
    env_ = nullptr;

    HM_LOGI("SkillInvokerHelper: Cleared");
}

} // namespace a2ui
