#pragma once

#include <string>
#include <functional>

namespace agenui {

/**
 * @brief Function call execution status
 */
enum class FunctionCallStatus {
    Success,    // Call succeeded
    Error,      // Call failed
    Pending,    // Async request submitted, awaiting callback result
    Completed   // Async execution completed
};

/**
 * @brief Function call result
 * 
 * Encapsulates the result of a platform function call,
 * including execution status, return data, and error information.
 */
struct FunctionCallResult {
    FunctionCallStatus status = FunctionCallStatus::Error;  // Execution status, default Error
    std::string data;    // Return data on success (JSON string)
    std::string error;   // Error message on failure
};

/**
 * @brief Callback type for asynchronous function calls
 * @param result The function call result
 */
using FunctionCallCallback = std::function<void(const FunctionCallResult&)>;

/**
 * @brief Platform function interface
 * 
 * Defines a unified interface for invoking platform-side functions.
 * Platform layer (iOS/Android/Harmony) should implement this interface to:
 * 1. Handle synchronous function calls
 * 2. Handle asynchronous function calls with callback
 */
class IPlatformFunction {
public:
    virtual ~IPlatformFunction() = default;
    
    /**
     * @brief Invoke the function synchronously
     * 
     * @param params Parameters as a JSON string
     * @return FunctionCallResult containing the execution result
     * 
     * @note This method blocks until the function call completes.
     */
    virtual FunctionCallResult callSync(const std::string& params) = 0;
    
    /**
     * @brief Invoke the function asynchronously
     * 
     * @param params Parameters as a JSON string
     * @param callback Callback to receive the result when execution completes
     * @return FunctionCallResult typically returns immediately with a pending or initial status
     * 
     * @note Async call flow:
     *       1. Returns immediately
     *       2. Executes the function in the background
     *       3. Invokes the callback with the result upon completion
     */
    virtual FunctionCallResult callAsync(const std::string& params,
                                         const FunctionCallCallback& callback) = 0;
};

} // namespace agenui
