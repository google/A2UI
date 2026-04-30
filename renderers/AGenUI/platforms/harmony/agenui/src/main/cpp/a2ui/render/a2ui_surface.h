#pragma once

#include <string>
#include <vector>
#include <map>
#include <nlohmann/json.hpp>
#include <arkui/native_node.h>
#include <arkui/native_node_napi.h>
#include "factory/a2ui_component_registry.h"
#include "agenui_dispatcher_types.h"
#include "agenui_component_render_observable.h"
#include "agenui_surface_layout_observable.h"

namespace a2ui {

class A2UIComponent;

/**
 * Surface
 * Closely aligned with the cross-platform Surface interface.
 *
 * Responsibilities:
 * 1. Manage the component tree
 * 2. Orchestrate the full update pipeline
 * 3. Manage surface lifecycle state
 * 4. Mount and unmount native UI nodes through contentHandle
 *
 * Each surface owns an independent ComponentRegistry copied from the global factories.
 */
class A2UISurface {
public:
    /**
     * Surface lifecycle states.
     *
     * State machine diagram:
     *
     *   [constructor]
     *        │
     *        ▼
     *     CREATED ──── setContentHandle(valid) ───► BOUND
     *        │                                         │
     *        └──────────── destroy() ─────────────────┤
     *                                                  │
     *                                             DESTROYED
     *                                          (terminal state)
     *
     * Transition rules:
     *   CREATED  → BOUND      : setContentHandle() called with a non-null handle
     *   CREATED  → DESTROYED  : destroy() called before any container is bound
     *   BOUND    → DESTROYED  : destroy() called (normal shutdown path)
     *   DESTROYED → *         : no further transitions; all public mutating methods
     *                           become no-ops or are guarded by ~A2UISurface().
     *
     * Method preconditions:
     *   setContentHandle()     – any state; CREATED → BOUND on non-null handle
     *   mountRootNode()        – BOUND; silently skipped if contentHandle_ is null
     *   unmountRootNode()      – BOUND; silently skipped if contentHandle_ is null
     *   handleComponentAdd()   – CREATED or BOUND; undefined behaviour in DESTROYED
     *   handleComponentsUpdate()– CREATED or BOUND; updates are skipped when the
     *                             component id is not found (safe no-op in DESTROYED)
     *   addComponent()         – CREATED or BOUND
     *   destroy()              – any state; ~A2UISurface() calls it when state_ != DESTROYED
     *
     * @warning Calling handleComponentAdd() or addComponent() in DESTROYED state
     *          accesses freed memory (UAF). Callers must check getState() before
     *          dispatching messages to a surface that may already be destroyed.
     */
    enum class State {
        CREATED,    // Constructed; no ArkUI container attached yet
        BOUND,      // contentHandle set; root node mounted into the container
        DESTROYED   // destroy() has completed; object must not be used further
    };

    /**
     * Constructor
     * @param surfaceId Surface ID
     * @param registry Surface-specific ComponentRegistry copied from the global factories
     * @param animated Whether components on this surface may play animations (from CreateSurfaceMessage)
     * @param componentRenderObservable Component render observer owned by SurfaceManager
     * @param surfaceLayoutObservable Surface layout observer owned by SurfaceManager
     */
    A2UISurface(const std::string& surfaceId, ComponentRegistry* registry, bool animated = true,
                agenui::IComponentRenderObservable* componentRenderObservable = nullptr,
                agenui::ISurfaceLayoutObservable* surfaceLayoutObservable = nullptr);
    ~A2UISurface();

    // ---- Basic Information ----
    const std::string& getSurfaceId() const;
    State getState() const;
    ComponentRegistry& getComponentRegistry();

    /**
     * Return whether components on this surface may play animations.
     * The value comes from CreateSurfaceMessage.animated and is immutable for the surface lifetime.
     */
    bool isAnimated() const { return animated_; }

    // Native UI container management

    /**
     * Set the ArkUI NodeContent handle passed in from the ArkTS ContentSlot.
     */
    void setContentHandle(ArkUI_NodeContentHandle handle);

    /**
     * Mount the root component node into contentHandle.
     */
    void mountRootNode();

    /**
     * Unmount the root component node from contentHandle.
     */
    void unmountRootNode();


    /**
     * Handle a ComponentsAdd message for one component.
     * @param msg ComponentsAddMessage containing parentId, componentId, and component JSON
     */
    void handleComponentAdd(const agenui::ComponentsAddMessage& msg);

    /**
     * Handle ComponentsUpdate messages for existing components.
     * @param msgs ComponentsUpdateMessage list
     */
    void handleComponentsUpdate(const std::vector<agenui::ComponentsUpdateMessage>& msgs);

    /**
     * Handle ComponentsRemove messages – detach, destroy, and free each named component
     * together with its entire subtree.
     *
     * For every entry in @p msgs the method:
     *   1. Looks up the component in componentTree_ by componentId.
     *   2. Detaches it from its parent (both C++ children list and ArkUI node tree).
     *   3. Recursively collects every descendant id into componentTree_ for removal.
     *   4. Calls destroy() on the root of the removed subtree to release all native
     *      resources (ArkUI nodes, AVPlayer handles, ImageLoader requests, …).
     *   5. Deletes the C++ object and erases all collected ids from componentTree_
     *      and registry_.
     *
     * @param msgs ComponentsRemoveMessage list
     */
    void handleComponentsRemove(const std::vector<agenui::ComponentsRemoveMessage>& msgs);


    /**
     * Get the component render completion observer
     */
    agenui::IComponentRenderObservable* getComponentRenderObservable() const { return componentRenderObservable_; }

    /**
     * Get the surface layout observer
     */
    agenui::ISurfaceLayoutObservable* getSurfaceLayoutObservable() const { return surfaceLayoutObservable_; }

    /**
     * Return the root component.
     */
    A2UIComponent* getRootComponent() const;

    /**
     * Set the root component.
     */
    void setRootComponent(A2UIComponent* component);

    /**
     * Return the component for a specific ID.
     */
    A2UIComponent* getComponent(const std::string& id) const;

    /**
     * Add a component to the surface.
     *
     * Internal flow:
     * 1. Set surfaceId
     * 2. Add the component to componentTree
     * 3. Establish the parent-child relationship
     * 4. Register the component in the registry
     */
    void addComponent(const std::string& parentId, A2UIComponent* component);

    /**
     * Return the number of components in the tree.
     */
    int getComponentCount() const;

    /**
     * Destroy the surface
     * Tears down the surface by recursively destroying the component tree.
     */
    void destroy();

private:
    /**
     * Find the parent component in componentTree that references childId.
     *
     * @param childId Child component ID
     * @return Parent component ID, or an empty string if missing
     */
    std::string findParentInComponentTree(const std::string& childId);

    /**
     * Try to mount orphan children onto a newly arrived parent component.
     *
     * @param parentComponent Parent component
     * @param properties Parent properties containing children/child references
     */
    void tryMountOrphanChildren(A2UIComponent* parentComponent, const nlohmann::json& properties);

    std::string surfaceId_;
    State state_;
    ComponentRegistry* registry_;                          // Surface-specific registry
    A2UIComponent* rootComponent_;                         // Root component
    std::map<std::string, A2UIComponent*> componentTree_;  // Component tree (id -> component)
    ArkUI_NodeContentHandle contentHandle_;                // ArkTS container handle for native node mounting
    bool animated_;                                        // Whether components on the surface may animate
    agenui::IComponentRenderObservable* componentRenderObservable_;  // Non-owning component render observer
    agenui::ISurfaceLayoutObservable* surfaceLayoutObservable_;       // Non-owning surface layout observer
};

} // namespace a2ui
