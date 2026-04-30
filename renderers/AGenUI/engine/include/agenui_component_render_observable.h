#pragma once
#include <string>
#include <cfloat>

namespace agenui {

struct ComponentRenderInfo {
    std::string surfaceId;   // Component surface ID
    std::string componentId; // Component ID
    std::string type;       // Component type
    float width = 0.0f;      // Width, in a2ui logical units, i.e., pv * 2
    float height = 0.0f;     // Height, in a2ui logical units, i.e., pv * 2
};


class ComponentRenderListener {
public:
    virtual ~ComponentRenderListener() {}
    virtual void onRenderFinish(const ComponentRenderInfo& info) = 0;
};

class IComponentRenderObservable {
public:
    virtual ~IComponentRenderObservable() {}
    /**
     * @brief  Adds a component render completion observer
     * @param  observer Observer instance pointer
     * @return void
     */
    virtual void addComponentRenderListener(ComponentRenderListener *observer) = 0;

    /**
     * @brief  Removes a component render completion observer
     * @param  observer Observer instance pointer
     * @return void
     */
    virtual void removeComponentRenderListener(ComponentRenderListener *observer) = 0;

    /**
     * @brief  Notifies all listeners that component rendering is complete
     * @param  info Render info
     * @return void
     */
    virtual void notifyRenderFinish(const ComponentRenderInfo& info) = 0;
};

} // namespace agenui
