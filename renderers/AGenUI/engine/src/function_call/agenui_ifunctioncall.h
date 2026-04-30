#pragma once

#include "agenui_functioncall_config.h"
#include "function_call/agenui_functioncall_resolution.h"
#include "agenui_functioncall_validator.h"
#include <memory>
#include "nlohmann/json.hpp"

namespace agenui {

/**
 * @brief Abstract base class for all functionCalls
 *
 * Defines the interface that every functionCall must implement.
 * Register new functionCalls in C++ by subclassing this class.
 */
class IFunctionCall {
public:
    virtual ~IFunctionCall() = default;
    
    /**
     * @brief Execute the functionCall
     * @param args FunctionCall arguments (JSON object)
     * @return Execution result
     */
    virtual FunctionCallResolution execute(const nlohmann::json& args) = 0;

    /**
     * @brief Validate arguments against the functionCall's parameter schema
     * @param args Arguments JSON object
     * @param result Validation result output
     * @return true if validation passes, false otherwise
     * @remark Subclasses may override this method for custom validation logic
     */
    virtual bool validate(const nlohmann::json& args, ValidationResult& result) {
        // Default: validate using FunctionCallValidator based on JSON Schema
        FunctionCallValidator validator;
        return validator.validate(getConfig().getParameters(), args, result);
    }

    /**
     * @brief Get the functionCall configuration
     * @return FunctionCallConfig object
     */
    virtual FunctionCallConfig getConfig() const = 0;

    /**
     * @brief Get the functionCall name
     * @return FunctionCall name
     */
    virtual std::string getName() const {
        return getConfig().getName();
    }

    /**
     * @brief Get the fully qualified functionCall name (including namespace)
     * @return Full name
     */
    virtual std::string getFullName() const {
        return getConfig().getFullName();
    }

    /**
     * @brief Check whether the functionCall executes synchronously
     * @return true if synchronous, false if asynchronous
     */
    virtual bool isSync() const {
        return getConfig().isSync();
    }
};

/**
 * @brief FunctionCall smart pointer type
 */
using FunctionCallPtr = std::shared_ptr<IFunctionCall>;

} // namespace agenui
