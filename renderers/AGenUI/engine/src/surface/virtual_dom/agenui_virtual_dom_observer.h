#pragma once

#include <string>

namespace agenui {

/**
 * @brief Virtual DOM observer interface
 * @remark Used to listen for structural change events on the virtual DOM tree
 */
class IVirtualDOMObserver {
public:
    /**
     * @brief Virtual destructor
     */
    virtual ~IVirtualDOMObserver() = default;

    /**
     * @brief Node update callback
     * @param componentId Component ID
     * @param nodeJson Node JSON string
     * @remark Called when a virtual DOM node is updated
     */
    virtual void onNodeUpdate(const std::string& componentId, const std::string& nodeJson) = 0;

    /**
     * @brief Node added callback
     * @param parentId Parent node ID
     * @param nodeJson Node JSON string
     * @remark Called when a virtual DOM node is added
     */
    virtual void onNodeAdded(const std::string& parentId, const std::string& nodeJson) = 0;

    /**
     * @brief Node removed callback
     * @param parentId Parent node ID
     * @param id Node ID
     * @remark Called when a virtual DOM node is removed
     */
    virtual void onNodeRemoved(const std::string& parentId, const std::string& id) = 0;
};

}  // namespace agenui