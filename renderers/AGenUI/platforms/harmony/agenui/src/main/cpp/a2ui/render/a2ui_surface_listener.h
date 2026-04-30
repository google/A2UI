#pragma once

#include <string>

namespace a2ui {

class A2UISurface;

/**
 * Surface lifecycle listener interface.
 * Surface lifecycle listener.
 *
 * Used to notify external observers about surface and component lifecycle events.
 */
class ISurfaceListener {
public:
    virtual ~ISurfaceListener() {}

    /**
     * Called after surface creation.
     * Called after the surface is created.
     *
     * @param surfaceId Surface ID
     * @param surface Surface instance pointer
     */
    virtual void onSurfaceCreated(const std::string& surfaceId, A2UISurface* surface) = 0;

    /**
     * Called after surface destruction.
     * Called after the surface is destroyed.
     *
     * @param surfaceId Surface ID
     */
    virtual void onSurfaceDestroyed(const std::string& surfaceId) = 0;

    /**
     * Called when a component is added to the surface.
     * Called when a component is added to the surface.
     *
     * @param surfaceId Surface ID
     * @param componentId Component ID
     */
    virtual void onComponentAdded(const std::string& surfaceId, const std::string& componentId) = 0;

    /**
     * Called when a component is removed from the surface.
     * Called when a component is removed from the surface.
     *
     * @param surfaceId Surface ID
     * @param componentId Component ID
     */
    virtual void onComponentRemoved(const std::string& surfaceId, const std::string& componentId) = 0;
};

} // namespace a2ui
