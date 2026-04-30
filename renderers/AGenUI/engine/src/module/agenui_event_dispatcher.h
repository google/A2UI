#pragma once

#include "agenui_dispatcher_types.h"
#include "agenui_message_listener.h"
#include <string>
#include <vector>
#include <mutex>

namespace agenui {

/**
 * @brief AGenUI event dispatcher
 *
 * Dispatches engine-internal surface/component change events to all registered listeners.
 * Exists as a member of SurfaceManager; does not expose a virtual interface.
 *
 * Thread-safe: all public methods are internally locked.
 */
class EventDispatcher {
public:
    void addEventListener(IAGenUIMessageListener* listener);
    void removeEventListener(IAGenUIMessageListener* listener);
    void removeAllEventListeners();

    void dispatchCreateSurface(const CreateSurfaceMessage& msg);
    void dispatchUpdateComponents(const UpdateComponentsMessage& msg);
    void dispatchDeleteSurface(const DeleteSurfaceMessage& msg);

    void dispatchComponentsUpdate(const std::string& surfaceId, const std::vector<ComponentsUpdateMessage>& messages);
    void dispatchComponentsAdd(const std::string& surfaceId, const std::vector<ComponentsAddMessage>& messages);
    void dispatchComponentsRemove(const std::string& surfaceId, const std::vector<ComponentsRemoveMessage>& messages);

    void dispatchInteractionStatusEvent(int32_t eventType, const std::string &content);

    /**
     * @brief Forwards action events from the renderer to all observers.
     * @param content Action event content with data bindings resolved
     */
    void dispatchActionEventRouted(const std::string &content);

private:
    std::recursive_mutex _mutex;
    std::vector<IAGenUIMessageListener*> _listeners;
};

}  // namespace agenui
