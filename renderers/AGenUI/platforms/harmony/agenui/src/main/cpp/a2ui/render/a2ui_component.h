#pragma once

#include <string>
#include <vector>
#include <memory>
#include <nlohmann/json.hpp>
#include "a2ui_component_types.h"
#include "a2ui_node.h"
#include "a2ui_component_state.h"
#include "agenui_component_render_observable.h"

namespace a2ui {

class ComponentState;

/**
 * Component base class (refactored)
 * 
 * Refactoring highlights:
 * 1. Add ComponentState support to separate the data layer
 * 2. Add the incremental update method updateView()
 * 3. Keep compatibility with the original interfaces
 * 
 * Cross-platform field mapping:
 *   String id                      -> std::string m_id
 *   String componentType           -> std::string m_componentType
 *   Map<String, Object> properties -> ComponentState::m_properties (data layer)
 *   View view                      -> ArkUI_NodeHandle m_nodeHandle (native Harmony UI node)
 *   A2UIComponent parent           -> A2UIComponent* m_parent
 *   List<A2UIComponent> children   -> std::vector<A2UIComponent*> m_children
 *   String surfaceId               -> std::string m_surfaceId
 */
class A2UIComponent {
public:
    A2UIComponent(const std::string& id, const std::string& componentType);
    virtual ~A2UIComponent();
    
    // ---- Basic information (unchanged)----
    const std::string& getId() const {
        return m_id;
    }
    
    const std::string& getComponentType() const {
        return m_componentType;
    }
    
    /**
     * Get properties (compatibility API)
     * Prefer State when present; otherwise fall back to local m_properties.
     */
    const nlohmann::json& getProperties() const;
    
    A2UIComponent* getParent() const {
        return m_parent;
    }

     A2UINode getNode() {
        return A2UINode(m_nodeHandle);
     }
    
    const std::vector<A2UIComponent*>& getChildren() const {
        return m_children;
    };
    
    const std::string& getSurfaceId() const {
        return m_surfaceId;
    };
    
    ArkUI_NodeHandle getNodeHandle() const {
        return m_nodeHandle;
    };
    
    void setSurfaceId(const std::string& surfaceId) {
        m_surfaceId = surfaceId;
        if (m_state) {
            m_state->setSurfaceId(surfaceId);
        }
    }
    
    // ---- State binding (new)----
    void setState(ComponentState* state) { m_state = state; }
    ComponentState* getState() const { return m_state; }
    
    // ---- Property updates (refactored)----
    
    /**
     * Update properties (compatibility API)
     * If State exists, update State and trigger an incremental refresh
     * If State does not exist, fall back to the original full refresh logic
     */
    void updateProperties(const nlohmann::json& newProps);

    /**
     * @brief Update layout-related properties (new)
     * 
     * @param newProps 
     */
    void updateLayoutProperties(const nlohmann::json& newProps);
    
    /**
     * Incrementally update the view (new)
     * Only update properties marked dirty in State
     */
    virtual void updateView();
    
    // ---- Parent-child relationship (unchanged)----
    virtual void addChild(A2UIComponent* child);
    virtual void removeChild(A2UIComponent* child);
    void removeChildById(const std::string& childId);
    
    // ---- Event dispatch (new, aligned with the cross-platform A2UIComponent.handleClick)----
    
    /**
     * Dispatch the Action event to the SDK layer
     * Matches the logic in the cross-platform A2UIComponent.handleClick():
     *   Build {"action": actionValue} JSON and dispatch ActionMessage through EventDispatcher
     * 
     * @param actionDef Value of the action property (JSON object)
     */
    void dispatchAction(const nlohmann::json& actionDef);
    
    /**
     * Set the click listener (aligned with the cross-platform setupClickListener)
     * Register or unregister click events automatically based on the action property
     */
    void setupClickListener();
    
    /**
     * Check whether clicks are disabled (subclasses may override)
     * Mirrors the disabled behavior in the cross-platform ButtonComponent.
     */
    virtual bool isClickDisabled() const { return false; }
    
    // ---- Lifecycle (unchanged)----
    virtual void destroy();
    virtual bool shouldAutoAddChildView() const;
    virtual bool shouldApplyChildLayoutPosition(const A2UIComponent* child) const;
    bool hasPendingAppearAnimation() const { return m_pendingAppearAnimation; }
    void prepareAppearAnimation(const nlohmann::json& properties);
    void playAppearAnimationIfNeeded();

    /**
     * Inject the animation flag from the owning surface (called by A2UISurface during addComponent)
     *   - Surface animated=false -> disable animations for all components on the surface
     *   - Surface animated=true  -> allow components on the surface to animate normally
     */
    void setSurfaceAnimated(bool animated) { m_surfaceAnimated = animated; }
    bool isSurfaceAnimated() const { return m_surfaceAnimated; }

    /**
     * Inject the component render completion observer from the owning surface.
     */
    void setComponentRenderObservable(agenui::IComponentRenderObservable* observable) { m_componentRenderObservable = observable; }
    agenui::IComponentRenderObservable* getComponentRenderObservable() const { return m_componentRenderObservable; }

protected:
    /**
     * Shared action click callback (static function)
     * Mirrors the cross-platform setupClickListener with view.setOnClickListener(v -> handleClick()).
     */
    static void onActionClickCallback(ArkUI_NodeEvent* event);

    /**
     * Parse color strings (aligned with the cross-platform A2UIUtils.parseColor)
     * Supported formats:
     *   #RRGGBB        -> 0xFFRRGGBB (opaque)
     *   #RRGGBBAA      -> 0xAARRGGBB (alpha included, bytes reordered)
     *   rgba(r,g,b,a)  -> a is a 0.0-1.0 float
     *   rgb(r,g,b)     -> opaque
     * Return 0x00000000 on parse failure (transparent, aligned with the cross-platform Color.TRANSPARENT)
     */
    static uint32_t parseColor(const std::string& colorStr);

    float getX() const { return m_x; }
    float getY() const { return m_y; }

public:
    float getWidth() const { return m_width; }
    float getHeight() const { return m_height; }

protected:
    void setHeight(float height);
    
    // Saved raw style information for width and height.
    const std::string& getStyleInfo() const { return m_styleInfo; }


protected:
    /**
     * Single-property update hook (new)
     * Subclasses override this method to implement incremental updates for specific properties
     */
    virtual void onUpdateProperty(const std::string& key, const nlohmann::json& value);
    
    /**
     * Full-property update hook (retained)
     * Used for initialization or compatibility with legacy logic
     */
    virtual void onUpdateProperties(const nlohmann::json& properties);
    
    /**
     * Apply the background-image style
     * Create an IMAGE child node under the component node, with the same size and the lowest z-index
     * @param styles Style JSON object
     */
    void applyBackgroundImage(const nlohmann::json& styles);
    virtual float resolveAppearTargetOpacity(const nlohmann::json& properties) const;
    
private:
    // Layout-related information is stored here temporarily and will be consolidated into State later
    float m_x = 0;
    float m_y = 0;
    float m_width = 0;
    float m_height = 0;
    std::string m_styleInfo;  // Stored raw style information (width/height values)
    
protected:
    std::string m_id;
    std::string m_componentType;
    nlohmann::json m_properties;  // Retained for compatibility (used when State is unavailable)
    std::vector<A2UIComponent*> m_children;
    std::string m_surfaceId;
    
    ComponentState* m_state = nullptr;  // New: bound state
    A2UIComponent* m_parent = nullptr;
    ArkUI_NodeHandle m_nodeHandle = nullptr;
    bool m_actionClickRegistered = false;  // Whether the shared action click event is registered
    
    // background-image node (first child, lowest z-index)
    ArkUI_NodeHandle m_backgroundImageHandle = nullptr;
    std::string m_backgroundImageUrl;  // Store the current background image URL to avoid redundant updates
    std::string m_backgroundImageRequestId;  // Current external loader request ID (empty when unused)
    bool m_pendingAppearAnimation = false;
    bool m_hasPlayedAppearAnimation = false;
    float m_appearTargetOpacity = 1.0f;
    bool m_surfaceAnimated = true;  // Animation flag of the owning surface (injected by A2UISurface)
    agenui::IComponentRenderObservable* m_componentRenderObservable = nullptr;  // Component render completion observer (injected by A2UISurface, non-owning)
};

} // namespace a2ui
