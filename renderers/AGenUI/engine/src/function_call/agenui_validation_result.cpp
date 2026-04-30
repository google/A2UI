#include "agenui_validation_result.h"

namespace agenui {

ValidationResult::ValidationResult() : _valid(true) {
}

ValidationResult::ValidationResult(bool valid) : _valid(valid) {
}

ValidationResult::~ValidationResult() {
}

ValidationResult ValidationResult::createSuccess() {
    return ValidationResult(true);
}

ValidationResult ValidationResult::createError(const std::string& error) {
    ValidationResult result(false);
    result._errors.emplace_back(error);
    return result;
}

void ValidationResult::addError(const std::string& error) {
    _valid = false;
    _errors.emplace_back(error);
}

std::string ValidationResult::getSummary() const {
    if (_valid) {
        return "Validation passed";
    }
    
    std::string summary = "Validation failed: ";
    for (size_t i = 0; i < _errors.size(); ++i) {
        if (i > 0) {
            summary += "; ";
        }
        summary += _errors[i];
    }
    
    return summary;
}

} // namespace agenui
