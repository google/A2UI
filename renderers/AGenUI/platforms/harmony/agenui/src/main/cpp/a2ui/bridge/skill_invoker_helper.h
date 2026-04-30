#pragma once

#include "napi/native_api.h"
#include <string>
#include <mutex>

namespace a2ui {

/**
 * Singleton helper for invoking skills through an ArkTS callback.
 *
 * Workflow:
 *   1. ArkTS calls registerSkillInvokerCallback(callback) to register the JS callback.
 *   2. C++ code, such as HarmonyPlatformInvoker, calls SkillInvokerHelper::invokeSkill(name, argsJson).
 *   3. The helper invokes the registered callback through NAPI so ArkTS can execute the skill.
 *   4. The callback returns the result as a JSON string.
 */
class SkillInvokerHelper {
public:
    static SkillInvokerHelper& getInstance();

    /**
     * Register the ArkTS invokeSkill callback.
     * @param env NAPI environment
     * @param callback ArkTS callback with signature (skillName: string, argsJson: string) => string
     */
    void registerCallback(napi_env env, napi_value callback);

    /**
     * Invoke the registered callback to run a skill.
     * @param skillName Skill name
     * @param argsJson Skill arguments as a JSON string
     * @return Result JSON string, or an empty string on failure
     */
    std::string invokeSkill(const std::string& skillName, const std::string& argsJson);

    /**
     * Clear the callback reference
     */
    void clear();

private:
    SkillInvokerHelper() = default;
    ~SkillInvokerHelper();

    SkillInvokerHelper(const SkillInvokerHelper&) = delete;
    SkillInvokerHelper& operator=(const SkillInvokerHelper&) = delete;

    napi_env env_ = nullptr;
    napi_ref callback_ref_ = nullptr;
    std::mutex mutex_;
};

} // namespace a2ui
