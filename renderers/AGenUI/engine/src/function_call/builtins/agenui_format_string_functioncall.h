#pragma once

#include "function_call/agenui_ifunctioncall.h"
#include "function_call/agenui_functioncall_resolution.h"
#include "function_call/agenui_functioncall_config.h"

namespace agenui {

/**
 * @brief FormatString functionCall — returns the result of string interpolation.
 *
 * Note: actual interpolation (parsing ${} expressions, accessing the data model, type conversion, etc.)
 * is performed by the caller (ExpressionParser/StateEngine). This functionCall only returns the final value.
 */
class FormatStringFunctionCall : public IFunctionCall {
public:
    FormatStringFunctionCall() = default;
    
    FunctionCallResolution execute(const nlohmann::json& args) override;
    FunctionCallConfig getConfig() const override;
    
    bool isSync() const override {
        return true;
    }
};

} // namespace agenui
