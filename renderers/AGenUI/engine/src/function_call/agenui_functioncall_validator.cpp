#include "agenui_functioncall_validator.h"
#include "nlohmann/json-schema.hpp"
#include "agenui_log.h"
#include <vector>

namespace agenui {

// Custom error handler that collects validation errors
class SkillValidationErrorHandler : public nlohmann::json_schema::error_handler {
private:
    std::vector<std::string> _errors;
    
public:
    void error(const nlohmann::json::json_pointer& ptr, 
               const nlohmann::json& instance, 
               const std::string& message) override {
        // Collect error message
        std::string errorMsg = message;
        if (!ptr.empty()) {
            errorMsg = "At " + ptr.to_string() + ": " + message;
        }
        _errors.push_back(errorMsg);
    }
    
    bool hasError() const {
        return !_errors.empty();
    }
    
    const std::vector<std::string>& getErrors() const {
        return _errors;
    }
};

FunctionCallValidator::FunctionCallValidator() {
}

FunctionCallValidator::~FunctionCallValidator() {
}

bool FunctionCallValidator::validate(const nlohmann::json& schema, const nlohmann::json& args, ValidationResult& result) {
    // Skip validation if schema is null or not an object
    if (schema.is_null() || !schema.is_object()) {
        AGENUI_LOG("FunctionCallValidator validate, schema is null or not object, skip validation");
        return true;
    }
    
    // Validate using json-schema-validator without exceptions
    nlohmann::json_schema::json_validator validator;
    validator.set_root_schema(schema);

    SkillValidationErrorHandler errorHandler;
    validator.validate(args, errorHandler);

    if (errorHandler.hasError()) {
        for (const auto& error : errorHandler.getErrors()) {
            result.addError(error);
            AGENUI_LOG("FunctionCallValidator validation error: %s", error.c_str());
        }
        return false;
    }
    
    AGENUI_LOG("validate success");
    return true;
}

} // namespace agenui
