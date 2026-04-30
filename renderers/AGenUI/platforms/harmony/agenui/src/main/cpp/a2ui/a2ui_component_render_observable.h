#pragma once

#include "agenui_component_render_observable.h"
#include <vector>
#include <mutex>

namespace agenui {

/**
 * @brief Observable implementation for component render completion events.
 * @remark Manages render listeners with multi-observer support.
 *
 * Behavior:
 * - Registers and manages multiple ComponentRenderListener instances
 * - Notifies listeners when rendering finishes
 * - Keeps listener operations thread-safe
 */
class A2UIComponentRenderObservable : public IComponentRenderObservable {
public:
    A2UIComponentRenderObservable();
    ~A2UIComponentRenderObservable() override;

    A2UIComponentRenderObservable(const A2UIComponentRenderObservable&) = delete;
    A2UIComponentRenderObservable& operator=(const A2UIComponentRenderObservable&) = delete;

    /**
     * @brief Add a render listener.
     * @param observer Observer instance pointer
     */
    void addComponentRenderListener(ComponentRenderListener* observer) override;

    /**
     * @brief Remove a render listener.
     * @param observer Observer instance pointer
     */
    void removeComponentRenderListener(ComponentRenderListener* observer) override;

    /**
     * @brief Notify all listeners that rendering has finished.
     * @param info Render details
     */
    void notifyRenderFinish(const ComponentRenderInfo& info) override;

    /**
     * @brief Remove all listeners.
     */
    void clearAllListeners();

private:
    std::vector<ComponentRenderListener*> m_listeners;  // Registered listeners
    mutable std::mutex m_mutex;                         // Guards listener access
};

} // namespace agenui
