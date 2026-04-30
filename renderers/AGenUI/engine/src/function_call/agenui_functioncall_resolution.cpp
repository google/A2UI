#include "function_call/agenui_functioncall_resolution.h"

namespace agenui {

FunctionCallResolution::FunctionCallResolution() : _status(FunctionCallStatus::Success) {
}

FunctionCallResolution::~FunctionCallResolution() {
}

FunctionCallResolution FunctionCallResolution::createSuccess(const nlohmann::json& value) {
    FunctionCallResolution result;
    result._status = FunctionCallStatus::Success;
    result._value = value;
    return result;
}

FunctionCallResolution FunctionCallResolution::createError(const std::string& error) {
    FunctionCallResolution result;
    result._status = FunctionCallStatus::Error;
    result._error = error;
    return result;
}

FunctionCallResolution FunctionCallResolution::createPending(const std::string& requestId) {
    FunctionCallResolution result;
    result._status = FunctionCallStatus::Pending;
    result._requestId = requestId;
    return result;
}

FunctionCallResolution FunctionCallResolution::createCompleted(const std::string& requestId, const nlohmann::json& value) {
    FunctionCallResolution result;
    result._status = FunctionCallStatus::Completed;
    result._requestId = requestId;
    result._value = value;
    return result;
}

FunctionCallResolution FunctionCallResolution::fromPlatformResult(const FunctionCallResult& platformResult) {
    if (platformResult.status == FunctionCallStatus::Error) {
        return FunctionCallResolution::createError(platformResult.error);
    }
    if (platformResult.status == FunctionCallStatus::Pending) {
        // callSync should never return Pending; treat as a platform implementation error
        return FunctionCallResolution::createError("callSync unexpectedly returned Pending");
    }
    // status == Success
    // Treat empty data as a null return (allows platform functions with no return value)
    if (platformResult.data.empty()) {
        return FunctionCallResolution::createSuccess(nlohmann::json(nullptr));
    }
    nlohmann::json data = nlohmann::json::parse(platformResult.data, nullptr, false);
    if (data.is_discarded()) {
        return FunctionCallResolution::createError("Invalid JSON returned from platform function: " + platformResult.data);
    }
    return FunctionCallResolution::createSuccess(data);
}

nlohmann::json FunctionCallResolution::toJson() const {
    nlohmann::json json;
    
    switch (_status) {
        case FunctionCallStatus::Success:
            json["status"] = "success";
            break;
        case FunctionCallStatus::Error:
            json["status"] = "error";
            break;
        case FunctionCallStatus::Pending:
            json["status"] = "pending";
            break;
        case FunctionCallStatus::Completed:
            json["status"] = "completed";
            break;
    }
    
    if (!_value.is_null()) {
        json["value"] = _value;
    }
    
    if (!_error.empty()) {
        json["error"] = _error;
    }
    
    if (!_requestId.empty()) {
        json["requestId"] = _requestId;
    }
    
    return json;
}

bool FunctionCallResolution::isAsync() const {
    return _status == FunctionCallStatus::Pending || _status == FunctionCallStatus::Completed;
}

bool FunctionCallResolution::isCompleted() const {
    return _status == FunctionCallStatus::Success || _status == FunctionCallStatus::Error || _status == FunctionCallStatus::Completed;
}

} // namespace agenui
