#pragma once

#include "function_call/agenui_ifunctioncall.h"
#include "function_call/agenui_functioncall_resolution.h"
#include "function_call/agenui_functioncall_config.h"

namespace agenui {

/**
 * @brief ParseToken functionCall — resolves a token reference to its actual value
 */
class ParseTokenFunctionCall : public IFunctionCall {
public:
    ParseTokenFunctionCall() = default;
    
    FunctionCallResolution execute(const nlohmann::json& args) override;
    FunctionCallConfig getConfig() const override;
    
    bool isSync() const override {
        return true;
    }
};

} // namespace agenui
