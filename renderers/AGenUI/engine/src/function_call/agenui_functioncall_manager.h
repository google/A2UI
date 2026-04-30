#pragma once

#include "agenui_functioncall_config.h"
#include "function_call/agenui_functioncall_resolution.h"
#include "agenui_async_request_manager.h"
#include "agenui_ifunctioncall.h"
#include <string>
#include <vector>
#include <map>
#include <mutex>
#include <memory>
#include <atomic>

namespace agenui {

// Forward declarations
class FunctionCallValidator;
class IPlatformFunction;

/**
 * @brief FunctionCall entry combining a FunctionCallConfig and a platform function reference
 */
struct FunctionCallEntry {
    FunctionCallConfig config;
    IPlatformFunction* function = nullptr;
};

/**
 * @brief FunctionCall manager
 *
 * Manages registration, lookup, and execution of all functionCalls.
 */
class FunctionCallManager {
public:
    FunctionCallManager();
    ~FunctionCallManager();
    
    /**
     * @brief Register a functionCall with a platform function
     * @param config The functionCall configuration
     * @param function Platform function pointer
     * @return true if successfully registered, false if failed
     */
    bool registerFunctionCall(const FunctionCallConfig& config, IPlatformFunction* function);
    
    /**
     * @brief Unregister a functionCall by name
     * @param name The functionCall name to unregister
     * @return true if successfully unregistered, false if not found
     */
    bool unregisterFunctionCall(const std::string& name);

    /**
     * @brief Register a C++ functionCall instance
     * @param functionCall FunctionCall smart pointer
     * @return true if successfully registered, false if failed
     */
    bool registerFunctionCall(FunctionCallPtr functionCall);

    /**
     * @brief Execute a functionCall synchronously
     * @param name FunctionCall name
     * @param args Arguments
     * @return Execution result
     */
    FunctionCallResolution executeFunctionCallSync(const std::string& name, const nlohmann::json& args);

    /**
     * @brief Cancel an asynchronous request
     * @param requestId Request ID
     * @return true if successfully cancelled, false if not found
     */
    bool cancelAsyncRequest(const std::string& requestId);

    /**
     * @brief Get all registered functionCalls
     * @return List of functionCall configurations
     */
    std::vector<FunctionCallConfig> getAllFunctionCalls() const;

    /**
     * @brief Export the functionCall catalog
     * @return FunctionCall catalog as a JSON object
     */
    nlohmann::json exportCatalog() const;

    /**
     * @brief Generate a unique request ID
     * @return Unique request ID string
     */
    std::string generateRequestId();
    
private:
    std::map<std::string, FunctionCallEntry> _functionCalls;      // Platform functionCall map
    std::map<std::string, FunctionCallPtr> _cppFunctionCalls;     // C++ functionCall map
    FunctionCallValidator* _validator;                      // Parameter validator
    AsyncRequestManager* _asyncManager;              // Async request manager
    mutable std::mutex _mutex;                       // Mutex
    std::atomic<int> _requestIdCounter;              // Request ID counter

    /**
     * @brief Find a platform functionCall by name
     * @param name FunctionCall name
     * @return Pointer to the functionCall entry, or nullptr if not found
     */
    FunctionCallEntry* findFunctionCall(const std::string& name);

    /**
     * @brief Find a C++ functionCall by name
     * @param name FunctionCall name
     * @return FunctionCall smart pointer, or nullptr if not found
     */
    FunctionCallPtr findCppFunctionCall(const std::string& name);
};

} // namespace agenui
