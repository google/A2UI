#pragma once

#include "agenui_surface_layout_observable.h"
#include <vector>
#include <mutex>

namespace agenui {

/**
 * @brief Observable implementation for surface layout changes.
 * @remark Manages surface listeners with multi-observer support.
 *
 * Behavior:
 * - Registers and manages multiple SurfaceLayoutListener instances
 * - Notifies listeners when the surface size changes
 * - Keeps listener operations thread-safe
 */
class A2UISurfaceLayoutObservable : public ISurfaceLayoutObservable {
public:
    A2UISurfaceLayoutObservable();
    ~A2UISurfaceLayoutObservable() override;

    A2UISurfaceLayoutObservable(const A2UISurfaceLayoutObservable&) = delete;
    A2UISurfaceLayoutObservable& operator=(const A2UISurfaceLayoutObservable&) = delete;

    /**
     * @brief Add a surface layout listener.
     * @param listener Listener instance pointer
     */
    void addSurfaceLayoutListener(SurfaceLayoutListener* listener) override;

    /**
     * @brief Remove a surface layout listener.
     * @param listener Listener instance pointer
     */
    void removeSurfaceLayoutListener(SurfaceLayoutListener* listener) override;

    /**
     * @brief Notify all listeners that the surface size changed.
     * @param info Surface layout details
     */
    void notifySurfaceSizeChanged(const SurfaceLayoutInfo& info) override;

    /**
     * @brief Remove all listeners.
     */
    void clearAllListeners();

private:
    std::vector<SurfaceLayoutListener*> m_listeners;  // Registered listeners
    mutable std::mutex m_mutex;                      // Guards listener access
};

} // namespace agenui
