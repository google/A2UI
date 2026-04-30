#pragma once

#include "agenui_validation_result.h"
#include "nlohmann/json.hpp"

namespace agenui {

/**
 * @brief FunctionCall parameter validator
 *
 * Validates functionCall input arguments against a JSON Schema.
 * Uses the json-schema-validator library with full JSON Schema Draft 7 support.
 */
class FunctionCallValidator {
public:
    FunctionCallValidator();
    ~FunctionCallValidator();
    
    /**
     * @brief Validate arguments against a JSON Schema
     * @param schema JSON Schema object
     * @param args Arguments to validate
     * @param result Validation result (output parameter)
     * @return true if validation passes, false otherwise
     */
    bool validate(const nlohmann::json& schema, const nlohmann::json& args, ValidationResult& result);
};

} // namespace agenui
