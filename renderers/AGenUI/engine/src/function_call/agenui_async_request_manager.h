#pragma once

#include "function_call/agenui_functioncall_resolution.h"
#include <string>
#include <map>
#include <functional>
#include <chrono>
#include <mutex>

namespace agenui {

/**
 * @brief Context for an asynchronous functionCall execution request
 */
struct AsyncRequestContext {
    std::string requestId;
    std::string functionCallName;
    nlohmann::json args;
    ResolutionCallback callback;
    std::chrono::steady_clock::time_point startTime;
    int timeoutMs;                    // Timeout in milliseconds
    
    AsyncRequestContext() : timeoutMs(30000) {
        startTime = std::chrono::steady_clock::now();
    }
};

/**
 * @brief Asynchronous request manager
 *
 * Manages all pending async requests, dispatches callbacks, and checks for timeouts.
 */
class AsyncRequestManager {
public:
    AsyncRequestManager();
    ~AsyncRequestManager();
    
    /**
     * @brief Register an asynchronous request
     * @param context Request context
     */
    void registerRequest(const AsyncRequestContext& context);

    /**
     * @brief Handle an asynchronous callback
     * @param requestId Request ID
     * @param result Execution result
     * @return true if the request was found and handled, false otherwise
     */
    bool handleCallback(const std::string& requestId, const FunctionCallResolution& result);

    /**
     * @brief Cancel an asynchronous request
     * @param requestId Request ID
     * @return true if successfully cancelled, false if not found
     */
    bool cancelRequest(const std::string& requestId);

    /**
     * @brief Check for timed-out requests and trigger their error callbacks
     */
    void checkTimeouts();

    /**
     * @brief Get the number of pending requests
     * @return Pending request count
     */
    size_t getPendingCount() const;

private:
    std::map<std::string, AsyncRequestContext> _pendingRequests;  // Pending request map
    mutable std::mutex _mutex;
};

} // namespace agenui
