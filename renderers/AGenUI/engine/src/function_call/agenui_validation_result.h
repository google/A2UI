#pragma once

#include <string>
#include <vector>

namespace agenui {

/**
 * @brief Parameter validation result class
 *
 * Encapsulates the result of parameter validation, including pass/fail status and error list.
 */
class ValidationResult {
public:
    ValidationResult();
    explicit ValidationResult(bool valid);
    ~ValidationResult();
    
    /**
     * @brief Create a successful validation result
     * @return ValidationResult instance
     */
    static ValidationResult createSuccess();

    /**
     * @brief Create a failed validation result
     * @param error Error message
     * @return ValidationResult instance
     */
    static ValidationResult createError(const std::string& error);

    /**
     * @brief Add an error message
     * @param error Error message
     */
    void addError(const std::string& error);

    /**
     * @brief Get a summary of all errors
     * @return Error summary string
     */
    std::string getSummary() const;

    // Getters
    bool isValid() const { return _valid; }
    const std::vector<std::string>& getErrors() const { return _errors; }

    // Setters
    void setValid(bool valid) { _valid = valid; }

private:
    bool _valid;                        // Whether validation passed
    std::vector<std::string> _errors;   // Error list
};

} // namespace agenui
