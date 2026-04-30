//
//  AGenUIEngineFunction.h
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/4/21.
//

#pragma once

#ifdef __cplusplus

#include "agenui_platform_function.h"
#import <Foundation/Foundation.h>

@class AGenUICXXBridge;

namespace agenui {

/**
 * @brief iOS platform function implementation based on IPlatformFunction
 *
 * Each instance is bound to a specific function name and its corresponding
 * Objective-C callback. Unlike the old IPlatformInvoker approach (a single
 * invoker for all skills), each function is registered individually with
 * its own IPlatformFunction instance.
 *
 * Lifecycle:
 *   1. Created when a function is registered via AGenUICXXBridge
 *   2. Must call unregisterFunction before destruction to prevent dangling pointers
 */
class AGenUIEngineFunction : public IPlatformFunction {
public:
    /**
     * @brief Constructs a platform function bound to a specific function name
     * @param bridge Weak reference to AGenUICXXBridge (void* to avoid header dependencies)
     * @param functionName The name of the function this instance handles
     */
    AGenUIEngineFunction(void* bridge, const std::string& functionName);
    ~AGenUIEngineFunction() override;

    /**
     * @brief Synchronously invoke the platform function
     *
     * @param params Parameters as a JSON string
     * @return FunctionCallResult containing the execution result
     *
     * @note Implementation flow:
     *       1. Retrieves callback from AGenUICXXBridge using the bound function name
     *       2. Executes the OC callback with the params
     *       3. Parses and returns the result
     */
    FunctionCallResult callSync(const std::string& params) override;

    /**
     * @brief Asynchronously invoke the platform function
     *
     * @param params Parameters as a JSON string
     * @param callback Callback to receive the result when execution completes
     * @return FunctionCallResult with pending status
     */
    FunctionCallResult callAsync(const std::string& params,
                                 const FunctionCallCallback& callback) override;

private:
    void* _bridge;                 ///< Weak reference to AGenUICXXBridge
    std::string _functionName;     ///< The function name this instance is bound to

    /**
     * @brief Parses function call result from JSON string
     * @param resultJson JSON string returned by the OC callback
     * @return Parsed FunctionCallResult
     */
    FunctionCallResult parseFunctionCallResult(const std::string& resultJson);
};

} // namespace agenui

#endif // __cplusplus
