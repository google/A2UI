#pragma once

#include "agenui_dispatcher_types.h"

namespace agenui {

/**
 * @brief AGENUI Message Listener Interface
 * @remark Rendering engine or other modules can implement this interface to listen to AGENUI events
 */
class IAGenUIMessageListener {
public:
    virtual ~IAGenUIMessageListener() {}
    
    /**
     * @brief Handles the CreateSurface event
     * @param msg CreateSurface message
     */
    virtual void onCreateSurface(const CreateSurfaceMessage& msg) {};
    
    /**
     * @brief Handles the UpdateComponents event
     * @param msg UpdateComponents message
     */
    virtual void onUpdateComponents(const UpdateComponentsMessage& msg) {};
    
    /**
     * @brief Handles the DeleteSurface event
     * @param msg DeleteSurface message
     */
    virtual void onDeleteSurface(const DeleteSurfaceMessage& msg) {};
    
    /**
     * @brief Handles the ComponentsUpdate event
     * @param surfaceId Surface identifier
     * @param msg List of ComponentsUpdate messages
     */
    virtual void onComponentsUpdate(const std::string& surfaceId, const std::vector<ComponentsUpdateMessage>& msg) {};
    
    /**
     * @brief Handles the ComponentsAdd event
     * @param surfaceId Surface identifier
     * @param msg List of ComponentsAdd messages
     */
    virtual void onComponentsAdd(const std::string& surfaceId, const std::vector<ComponentsAddMessage>& msg) {};
    
    /**
     * @brief Handles the ComponentsRemove event
     * @param surfaceId Surface identifier
     * @param msg List of ComponentsRemove messages
     */
    virtual void onComponentsRemove(const std::string& surfaceId, const std::vector<ComponentsRemoveMessage>& msg) {};
    /**
     * @brief Implementation of interaction status, such as start, transfer content, end, etc.
     * @param eventType Event type
     * @param content Event content
     */
    virtual void onInteractionStatusEvent(int32_t eventType, const std::string &content) {};
    /**
     * @brief After the renderer triggers an action, forwards the action event to other observers
     * @param content actionEvent configuration content (data binding already resolved)
     */
    virtual void onActionEventRouted(const std::string &content) {};
};

}  // namespace agenui
