#pragma once

#include "agenui_component_snapshot.h"
#include <string>

namespace agenui {

/**
 * @brief Virtual DOM interface
 * @remark Defines the basic operations of the virtual DOM
 */
class IVirtualDOM {
public:
    /**
     * @brief Virtual destructor
     */
    virtual ~IVirtualDOM() = default;

    /**
     * @brief Update a node
     * @param snapshot Component snapshot
     * @remark Updates or creates a virtual DOM node
     */
    virtual void updateNode(const ComponentSnapshot& snapshot) = 0;

    /**
     * @brief Clear the virtual DOM tree
     */
    virtual void clear() = 0;
};

}  // namespace agenui