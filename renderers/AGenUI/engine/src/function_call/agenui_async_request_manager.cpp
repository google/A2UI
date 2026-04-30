#include "agenui_async_request_manager.h"
#include <algorithm>

namespace agenui {

AsyncRequestManager::AsyncRequestManager() {
}

AsyncRequestManager::~AsyncRequestManager() {
}

void AsyncRequestManager::registerRequest(const AsyncRequestContext& context) {
    std::lock_guard<std::mutex> lock(_mutex);
    _pendingRequests[context.requestId] = context;
}

bool AsyncRequestManager::handleCallback(const std::string& requestId, const FunctionCallResolution& result) {
    ResolutionCallback callback;
    {
        std::lock_guard<std::mutex> lock(_mutex);
        
        auto it = _pendingRequests.find(requestId);
        if (it == _pendingRequests.end()) {
            return false;
        }
        
        callback = std::move(it->second.callback);
        _pendingRequests.erase(it);
    }
    
    // Lock released; safe to invoke the callback and avoid re-entrant deadlock
    if (callback) {
        callback(result);
    }
    
    return true;
}

bool AsyncRequestManager::cancelRequest(const std::string& requestId) {
    std::lock_guard<std::mutex> lock(_mutex);
    
    auto it = _pendingRequests.find(requestId);
    if (it == _pendingRequests.end()) {
        return false;
    }
    
    _pendingRequests.erase(it);
    return true;
}

void AsyncRequestManager::checkTimeouts() {
    // While holding the lock: collect timed-out requests and remove them from the map
    std::vector<std::pair<std::string, ResolutionCallback>> timeoutCallbacks;
    {
        std::lock_guard<std::mutex> lock(_mutex);
        
        auto now = std::chrono::steady_clock::now();
        std::vector<std::string> timeoutRequests;
        
        for (const auto& pair : _pendingRequests) {
            const AsyncRequestContext& context = pair.second;
            auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - context.startTime);
            
            if (elapsed.count() > context.timeoutMs) {
                timeoutRequests.emplace_back(pair.first);
            }
        }
        
        for (const auto& requestId : timeoutRequests) {
            auto it = _pendingRequests.find(requestId);
            if (it != _pendingRequests.end()) {
                timeoutCallbacks.emplace_back(requestId, std::move(it->second.callback));
                _pendingRequests.erase(it);
            }
        }
    }
    
    // Lock released; safe to invoke callbacks and avoid re-entrant deadlock
    for (const auto& item : timeoutCallbacks) {
        if (item.second) {
            FunctionCallResolution timeoutResult = FunctionCallResolution::createError("Request timeout");
            timeoutResult.setRequestId(item.first);
            item.second(timeoutResult);
        }
    }
}

size_t AsyncRequestManager::getPendingCount() const {
    std::lock_guard<std::mutex> lock(_mutex);
    return _pendingRequests.size();
}

} // namespace agenui
