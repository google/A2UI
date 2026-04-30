#pragma once

#include "surface/virtual_dom/agenui_virtual_dom_node.h"
#include "surface/virtual_dom/agenui_ivirtual_dom.h"
#include <memory>
#include <string>
#include <map>

namespace agenui {

// Forward declaration
struct ComponentRenderInfo;
struct SurfaceLayoutInfo;

/**
 * @brief Virtual DOM
 * @remark Manages the component tree structure; serves as the intermediate representation before actual rendering
 */
class VirtualDOM : public IVirtualDOM, public IOrphanSnapshotFetcher {
public:
    /**
     * @brief Constructor
     * @param observer Virtual DOM observer
     */
    explicit VirtualDOM(IVirtualDOMObserver* observer);

    /**
     * @brief Destructor
     */
    ~VirtualDOM();

    /**
     * @brief Update a node
     * @param snapshot New component snapshot
     */
    void updateNode(const ComponentSnapshot& snapshot) override;

    /**
     * @brief Clear the tree
     */
    void clear() override;

    /**
     * @brief Get the root node
     * @return Shared pointer to the root node; nullptr if the tree is empty
     */
    std::shared_ptr<VirtualDOMNode> getRoot() const { return _root; }

    /**
     * @brief Fetch and remove the orphan snapshot for the specified ID
     * @param id Component ID
     * @param outSnapshot Output parameter; returns the found component snapshot
     * @return true if found, false otherwise
     * @remark The snapshot is automatically removed from the orphan collection after a successful fetch
     */
    bool takeOrphanSnapshot(const std::string& id, ComponentSnapshot& outSnapshot) override;

    /**
     * @brief Update the Markdown component dimensions
     * @param info Markdown render info, including component ID, type, and rendered size
     * @remark Looks up the corresponding VirtualDOMNode by componentId and type,
     *         then updates the Yoga node height
     */
    void updateComponentSize(const ComponentRenderInfo& info);

    /**
     * @brief Update the Surface dimensions
     * @param info Surface info, including surfaceId and size
     * @remark Updates the root container size of the surface
     */
    void updateSurfaceSize(const SurfaceLayoutInfo& info);

private:
    /**
     * @brief Recursively search for a node by ID
     * @param parent Parent node
     * @param id Component ID
     * @param outParentId Output parameter; returns the parent node ID when found
     * @return Shared pointer to the found node; nullptr if not found
     */
    std::shared_ptr<VirtualDOMNode> findNodeByIdRecursive(std::shared_ptr<VirtualDOMNode> parent, const std::string& id, std::string& outParentId);

    /**
     * @brief Recursively search for a node by componentId and type
     * @param parent Parent node
     * @param componentId Component ID
     * @param type Component type
     * @return Shared pointer to the found node; nullptr if not found
     */
    std::shared_ptr<VirtualDOMNode> findNodeByComponentIdAndTypeRecursive(std::shared_ptr<VirtualDOMNode> parent, const std::string& componentId, const std::string& type);

    /**
     * @brief Check and notify layout changes
     * @remark Recursively checks all nodes from the root and notifies the observer
     */
    void checkAndNotifyLayoutChanges();

    /**
     * @brief Check whether an orphan snapshot meets the display conditions
     * @param snapshot Snapshot to evaluate
     * @return true if it can be displayed, false otherwise
     * @remark Evaluated based on DisplayRule and children's dataBindingStatus
     */
    bool checkCanDisplay(const ComponentSnapshot& snapshot) const;

    /**
     * @brief Attempt to attach ready orphan snapshots to the component tree
     * @remark Iterates _dataDependentOrphanSnapshots and attaches those that pass checkCanDisplay
     */
    void tryAttachReadyOrphans();

    std::shared_ptr<VirtualDOMNode> _root;                       // Root node
    IVirtualDOMObserver* _observer;                              // Virtual DOM observer
    std::map<std::string, ComponentSnapshot> _directOrphanSnapshots;          // Orphan snapshots that display unconditionally
    std::map<std::string, ComponentSnapshot> _dataDependentOrphanSnapshots;   // Orphan snapshots that depend on data binding state
#if defined(__OHOS__)
    YGNodeRef _defaultRoot = nullptr;                            // Default top-level Yoga container node
    float _surfaceWidth  = 0.0f;                                 // Current surface width (vp); initialized from getDeviceScreenSize
    float _surfaceHeight = 0.0f;                                 // Current surface height (vp); initialized from getDeviceScreenSize
#endif
};

}  // namespace agenui
