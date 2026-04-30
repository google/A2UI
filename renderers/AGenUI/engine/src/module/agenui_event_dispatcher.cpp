#include "agenui_event_dispatcher.h"
#include "agenui_log.h"

namespace agenui {

void EventDispatcher::addEventListener(IAGenUIMessageListener* listener) {
    AGENUI_LOG("listener:%p", listener);
    if (listener == nullptr) {
        return;
    }
    std::lock_guard<std::recursive_mutex> mutexWrap(_mutex);
    _listeners.emplace_back(listener);
}

void EventDispatcher::removeEventListener(IAGenUIMessageListener* listener) {
    AGENUI_LOG("listener:%p", listener);
    if (listener == nullptr) {
        return;
    }
    std::lock_guard<std::recursive_mutex> mutexWrap(_mutex);
    for (auto it = _listeners.begin(); it != _listeners.end(); ++it) {
        if (*it == listener) {
            _listeners.erase(it);
            break;
        }
    }
}

void EventDispatcher::removeAllEventListeners() {
    std::lock_guard<std::recursive_mutex> mutexWrap(_mutex);
    _listeners.clear();
}

// Must be dispatched to the main thread on the native side
void EventDispatcher::dispatchCreateSurface(const CreateSurfaceMessage& msg) {
    AGENUI_LOG("[event-dispatcher] dispatchCreateSurface called, surfaceId=%s", msg.surfaceId.c_str());
    std::lock_guard<std::recursive_mutex> mutexWrap(_mutex);
    for (auto* listener : _listeners) {
        if (listener != nullptr) {
            listener->onCreateSurface(msg);
        }
    }
}

// Must be dispatched to the main thread on the native side
void EventDispatcher::dispatchUpdateComponents(const UpdateComponentsMessage& msg) {
    AGENUI_LOG("[event-dispatcher] dispatchUpdateComponents called, surfaceId=%s", msg.surfaceId.c_str());
    std::lock_guard<std::recursive_mutex> mutexWrap(_mutex);
    for (auto* listener : _listeners) {
        if (listener != nullptr) {
            listener->onUpdateComponents(msg);
        }
    }
}

// Must be dispatched to the main thread on the native side
void EventDispatcher::dispatchDeleteSurface(const DeleteSurfaceMessage& msg) {
    AGENUI_LOG("[event-dispatcher] dispatchDeleteSurface called, surfaceId=%s", msg.surfaceId.c_str());
    std::lock_guard<std::recursive_mutex> mutexWrap(_mutex);
    for (auto* listener : _listeners) {
        if (listener != nullptr) {
            listener->onDeleteSurface(msg);
        }
    }
}

// Must be dispatched to the main thread on the native side
void EventDispatcher::dispatchComponentsUpdate(const std::string& surfaceId, const std::vector<ComponentsUpdateMessage>& messages) {
    AGENUI_LOG("[event-dispatcher] dispatchComponentsUpdate called, surfaceId=%s, count=%zu", surfaceId.c_str(), messages.size());
    std::lock_guard<std::recursive_mutex> mutexWrap(_mutex);
    for (auto* listener : _listeners) {
        if (listener != nullptr) {
            listener->onComponentsUpdate(surfaceId, messages);
        }
    }
}

// Must be dispatched to the main thread on the native side
void EventDispatcher::dispatchComponentsAdd(const std::string& surfaceId, const std::vector<ComponentsAddMessage>& messages) {
    AGENUI_LOG("[event-dispatcher] dispatchComponentsAdd called, surfaceId=%s, count=%zu", surfaceId.c_str(), messages.size());
    std::lock_guard<std::recursive_mutex> mutexWrap(_mutex);
    for (auto* listener : _listeners) {
        if (listener != nullptr) {
            listener->onComponentsAdd(surfaceId, messages);
        }
    }
}

// Must be dispatched to the main thread on the native side
void EventDispatcher::dispatchComponentsRemove(const std::string& surfaceId, const std::vector<ComponentsRemoveMessage>& messages) {
    AGENUI_LOG("[event-dispatcher] dispatchComponentsRemove called, surfaceId=%s, count=%zu", surfaceId.c_str(), messages.size());
    std::lock_guard<std::recursive_mutex> mutexWrap(_mutex);
    for (auto* listener : _listeners) {
        if (listener != nullptr) {
            listener->onComponentsRemove(surfaceId, messages);
        }
    }
}

// Must be dispatched to the main thread on the native side
void EventDispatcher::dispatchInteractionStatusEvent(int32_t eventType, const std::string &content) {
    AGENUI_LOG("[event-dispatcher] dispatchInteractionStatusEvent called, type:%d, content:%s", eventType, content.c_str());
    std::lock_guard<std::recursive_mutex> mutexWrap(_mutex);
    for (auto* listener : _listeners) {
        if (listener != nullptr) {
            listener->onInteractionStatusEvent(eventType, content);
        }
    }
}

// Must be dispatched to the main thread on the native side
void EventDispatcher::dispatchActionEventRouted(const std::string &content) {
    AGENUI_LOG("[event-dispatcher] dispatchActionEventRouted called, content:%s", content.c_str());
    std::lock_guard<std::recursive_mutex> mutexWrap(_mutex);
    for (auto* listener : _listeners) {
        if (listener != nullptr) {
            listener->onActionEventRouted(content);
        }
    }
}

}  // namespace agenui
