#pragma once

#include "function_call/agenui_ifunctioncall.h"
#include "function_call/agenui_functioncall_resolution.h"
#include "function_call/agenui_functioncall_config.h"

namespace agenui {

/**
 * @brief Numeric validation functionCall — checks numeric range constraints
 */
class NumericFunctionCall : public IFunctionCall {
public:
    FunctionCallResolution execute(const nlohmann::json& args) override;
    FunctionCallConfig getConfig() const override;
    
    bool isSync() const override {
        return true;
    }
};

} // namespace agenui
