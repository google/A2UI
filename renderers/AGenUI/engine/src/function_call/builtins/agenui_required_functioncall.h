#pragma once

#include "function_call/agenui_ifunctioncall.h"
#include "function_call/agenui_functioncall_resolution.h"
#include "function_call/agenui_functioncall_config.h"

namespace agenui {

/**
 * @brief Required validation functionCall
 *
 * Checks that a value is non-empty (not null, undefined, or an empty string/array/object).
 */
class RequiredFunctionCall : public IFunctionCall {
public:
    FunctionCallResolution execute(const nlohmann::json& args) override;
    FunctionCallConfig getConfig() const override;
    
    bool isSync() const override {
        return true;
    }
};

} // namespace agenui
