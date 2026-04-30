#include "agenui_functioncall_manager.h"
#include "agenui_functioncall_validator.h"
#include "agenui_platform_function.h"
#include "agenui_log.h"
#include "agenui_type_define.h"
#include <fstream>
#include <sstream>

namespace agenui {

FunctionCallManager::FunctionCallManager() : _validator(nullptr), _asyncManager(nullptr), _requestIdCounter(0) {
    _validator = new FunctionCallValidator();
    _asyncManager = new AsyncRequestManager();
}

FunctionCallManager::~FunctionCallManager() {
    // NOTE: IPlatformFunction* pointers stored in _functionCalls are owned by the caller (platform/JNI layer).
    // FunctionCallManager does not release them. The caller must ensure all registered functions
    // are either unregistered or still alive before FunctionCallManager is destroyed,
    // otherwise executeFunctionCallSync may access a dangling pointer.
    _functionCalls.clear();
    _cppFunctionCalls.clear();
    SAFELY_DELETE(_validator);
    SAFELY_DELETE(_asyncManager);
}

bool FunctionCallManager::registerFunctionCall(const FunctionCallConfig& config, IPlatformFunction* function) {
    if (!config.isValid()) {
        AGENUI_LOG("[FunctionCallManager] registerFunctionCall failed: invalid config");
        return false;
    }
    if (!function) {
        AGENUI_LOG("[FunctionCallManager] registerFunctionCall failed: function is null");
        return false;
    }

    std::lock_guard<std::mutex> lock(_mutex);

    FunctionCallEntry entry;
    entry.config = config;
    entry.function = function;

    // Register by short name so lookups use "toast" rather than "agenui.platform::toast"
    const std::string& name = config.getName();
    std::string fullName = config.getFullName();
    _functionCalls[name] = entry;

    AGENUI_LOG("[FunctionCallManager] registerFunctionCall success: name:%s, fullName:%s", name.c_str(), fullName.c_str());

    return true;
}

bool FunctionCallManager::unregisterFunctionCall(const std::string& name) {
    std::lock_guard<std::mutex> lock(_mutex);
    auto it = _functionCalls.find(name);
    if (it == _functionCalls.end()) {
        AGENUI_LOG("[FunctionCallManager] unregisterFunctionCall failed: name:%s not found", name.c_str());
        return false;
    }
    _functionCalls.erase(it);
    AGENUI_LOG("[FunctionCallManager] unregisterFunctionCall success: name:%s", name.c_str());
    return true;
}

bool FunctionCallManager::registerFunctionCall(FunctionCallPtr functionCall) {
    if (!functionCall) {
        AGENUI_LOG("[FunctionCallManager] registerFunctionCall failed: functionCall is null");
        return false;
    }

    std::lock_guard<std::mutex> lock(_mutex);

    std::string name = functionCall->getName();
    _cppFunctionCalls[name] = functionCall;

    AGENUI_LOG("[FunctionCallManager] registerFunctionCall success: %s", name.c_str());
    return true;
}

FunctionCallResolution FunctionCallManager::executeFunctionCallSync(const std::string& name, const nlohmann::json& args) {
    AGENUI_LOG("[FunctionCallManager] executeFunctionCallSync: name=%s, args=%s, %zu, %zu", name.c_str(), args.dump().c_str(), _functionCalls.size(), _cppFunctionCalls.size());
    
    // While holding the lock: find the functionCall and copy the required data
    FunctionCallPtr cppFunctionCall;
    FunctionCallConfig platformConfig;
    IPlatformFunction* function = nullptr;
    bool foundPlatform = false;
    
    {
        std::lock_guard<std::mutex> lock(_mutex);        
        // 1. Look up C++ functionCall first
        cppFunctionCall = findCppFunctionCall(name);

        if (!cppFunctionCall) {
            // 2. Fall back to platform functionCall
            FunctionCallEntry* entry = findFunctionCall(name);
            if (entry) {
                AGENUI_LOG("Found platform functionCall");
                platformConfig = entry->config;
                function = entry->function;
                foundPlatform = true;
            }
        }
    }
    // Lock released; safe to call external code

    // Execute C++ functionCall
    if (cppFunctionCall) {
        AGENUI_LOG("Found C++ functionCall");
        ValidationResult validationResult;
        if (!cppFunctionCall->validate(args, validationResult)) {
            return FunctionCallResolution::createError(validationResult.getSummary());
        }
        return cppFunctionCall->execute(args);
    }

    // Execute platform functionCall
    if (!foundPlatform) {
        AGENUI_LOG("Platform functionCall not found: %s", name.c_str());
        return FunctionCallResolution::createError("FunctionCall not found: " + name);
    }
    
    // Validate arguments
    ValidationResult validationResult;
    if (!_validator->validate(platformConfig.getParameters(), args, validationResult)) {
        return FunctionCallResolution::createError(validationResult.getSummary());
    }

    // Execute platform functionCall synchronously
    if (function == nullptr) {
        AGENUI_LOG("Platform function is null for functionCall: %s", name.c_str());
        return FunctionCallResolution::createError("Platform function is null: " + name);
    }

    FunctionCallResult callResult = function->callSync(args.dump());
    FunctionCallResolution resolution = FunctionCallResolution::fromPlatformResult(callResult);
    if (resolution.getStatus() == FunctionCallStatus::Pending) {
        // callSync should never return Pending; treat as a platform implementation error
        AGENUI_LOG("[FunctionCallManager] callSync unexpectedly returned Pending for functionCall: %s", name.c_str());
        return FunctionCallResolution::createError("callSync unexpectedly returned Pending: " + name);
    }
    if (resolution.getStatus() == FunctionCallStatus::Error) {
        AGENUI_LOG("[FunctionCallManager] callSync failed for functionCall: %s, error: %s", name.c_str(), resolution.getError().c_str());
    }
    return resolution;
}


bool FunctionCallManager::cancelAsyncRequest(const std::string& requestId) {
    return _asyncManager->cancelRequest(requestId);
}

std::vector<FunctionCallConfig> FunctionCallManager::getAllFunctionCalls() const {
    std::lock_guard<std::mutex> lock(_mutex);
    
    std::vector<FunctionCallConfig> configs;
    
    // Add C++ functionCalls
    for (const auto& pair : _cppFunctionCalls) {
        configs.emplace_back(pair.second->getConfig());
    }

    // Add platform functionCalls
    for (const auto& pair : _functionCalls) {
        configs.emplace_back(pair.second.config);
    }

    return configs;
}

nlohmann::json FunctionCallManager::exportCatalog() const {
    std::lock_guard<std::mutex> lock(_mutex);

    nlohmann::json catalog;
    nlohmann::json functions = nlohmann::json::array();

    // Add C++ functionCalls
    for (const auto& pair : _cppFunctionCalls) {
        functions.emplace_back(pair.second->getConfig().toJson());
    }

    // Add platform functionCalls
    for (const auto& pair : _functionCalls) {
        functions.emplace_back(pair.second.config.toJson());
    }
    
    catalog["functions"] = functions;
    return catalog;
}


FunctionCallEntry* FunctionCallManager::findFunctionCall(const std::string& name) {
    auto it = _functionCalls.find(name);
    if (it != _functionCalls.end()) {
        return &(it->second);
    }
    return nullptr;
}

std::string FunctionCallManager::generateRequestId() {
    _requestIdCounter++;
    return "req_" + std::to_string(_requestIdCounter);
}

FunctionCallPtr FunctionCallManager::findCppFunctionCall(const std::string& name) {
    auto it = _cppFunctionCalls.find(name);
    if (it != _cppFunctionCalls.end()) {
        return it->second;
    }
    return nullptr;
}

} // namespace agenui
