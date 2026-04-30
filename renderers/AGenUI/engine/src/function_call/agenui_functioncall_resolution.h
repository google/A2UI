#pragma once

#include <string>
#include "nlohmann/json.hpp"
#include "agenui_platform_function.h"
namespace agenui {

/**
 * @brief FunctionCall execution resolution
 *
 * Encapsulates the resolution of a FunctionCall execution,
 * including status, return value, error message, and async request tracking.
 * This represents the engine-level execution outcome (parsed JSON, lifecycle awareness),
 * as opposed to FunctionCallResult which is the platform-level raw return.
 */
class FunctionCallResolution {
public:
    FunctionCallResolution();
    ~FunctionCallResolution();
    
    /**
     * @brief Create a success result
     * @param value Return value
     * @return FunctionCallResolution instance
     */
    static FunctionCallResolution createSuccess(const nlohmann::json& value);

    /**
     * @brief Create an error result
     * @param error Error message
     * @return FunctionCallResolution instance
     */
    static FunctionCallResolution createError(const std::string& error);

    /**
     * @brief Create an async pending result
     * @param requestId Request ID
     * @return FunctionCallResolution instance
     */
    static FunctionCallResolution createPending(const std::string& requestId);

    /**
     * @brief Create an async completed result
     * @param requestId Request ID
     * @param value Return value
     * @return FunctionCallResolution instance
     */
    static FunctionCallResolution createCompleted(const std::string& requestId, const nlohmann::json& value);

    /**
     * @brief Create a FunctionCallResolution from a platform-level FunctionCallResult
     *
     * Converts the raw platform result (string-based data) into the engine-level
     * resolution (parsed JSON value). Handles JSON parsing and error mapping.
     *
     * @param platformResult The platform-level function call result
     * @return FunctionCallResolution instance
     */
    static FunctionCallResolution fromPlatformResult(const FunctionCallResult& platformResult);

    /**
     * @brief Serialize to a JSON object
     * @return JSON object
     */
    nlohmann::json toJson() const;

    /**
     * @brief Check whether execution is asynchronous
     * @return true if async, false if sync
     */
    bool isAsync() const;

    /**
     * @brief Check whether async execution has completed
     * @return true if completed, false otherwise
     */
    bool isCompleted() const;

    // Getters
    FunctionCallStatus getStatus() const { return _status; }
    const nlohmann::json& getValue() const { return _value; }
    const std::string& getError() const { return _error; }
    const std::string& getRequestId() const { return _requestId; }

    // Setters
    void setStatus(FunctionCallStatus status) { _status = status; }
    void setValue(const nlohmann::json& value) { _value = value; }
    void setError(const std::string& error) { _error = error; }
    void setRequestId(const std::string& requestId) { _requestId = requestId; }

private:
    FunctionCallStatus _status;  // Execution status
    nlohmann::json _value;         // Return value
    std::string _error;            // Error message
    std::string _requestId;        // Async request ID
};

// Resolution callback function type
using ResolutionCallback = std::function<void(const FunctionCallResolution&)>;

} // namespace agenui
