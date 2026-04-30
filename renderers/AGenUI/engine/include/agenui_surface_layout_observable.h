#pragma once
#include <string>

namespace agenui {

/**
 * @brief Surface layout info structure
 */
struct SurfaceLayoutInfo {
    std::string surfaceId;   // Surface ID
    float width = 0.0f;      // Width, in a2ui logical units, i.e., pv * 2
    float height = 0.0f;     // Height, in a2ui logical units, i.e., pv * 2
};

/**
 * @brief Surface listener interface
 */
class SurfaceLayoutListener {
public:
    virtual ~SurfaceLayoutListener() {}

    /**
     * @brief Surface size changed
     * @param info Surface info
     */
    virtual void onSurfaceSizeChanged(const SurfaceLayoutInfo& info) = 0;
};

/**
 * @brief Surface layout change notification interface
 */
class ISurfaceLayoutObservable {
public:
    virtual ~ISurfaceLayoutObservable() {}

    /**
     * @brief Adds a Surface listener
     * @param listener Listener instance pointer
     */
    virtual void addSurfaceLayoutListener(SurfaceLayoutListener* listener) = 0;

    /**
     * @brief Removes a Surface listener
     * @param listener Listener instance pointer
     */
    virtual void removeSurfaceLayoutListener(SurfaceLayoutListener* listener) = 0;

    /**
     * @brief Notifies all listeners that the Surface size has changed
     * @param info Surface layout info
     */
    virtual void notifySurfaceSizeChanged(const SurfaceLayoutInfo& info) = 0;
};

} // namespace agenui
