#pragma once

#include "agenui_component_snapshot.h"
#include "agenui_virtual_dom_observer.h"
#include "agenui_virtual_dom_table.h"
#include "agenui_virtual_dom_choice_picker.h"
#include "agenui_virtual_dom_tabs.h"
#include <memory>
#include <vector>
#include <string>

#if defined(__OHOS__)
#include <yoga/Yoga.h>
#endif

namespace agenui {

/**
 * @brief Interface for fetching orphan component snapshots
 * @remark Used to retrieve snapshots of components whose parent node was not found
 */
class IOrphanSnapshotFetcher {
public:
    virtual ~IOrphanSnapshotFetcher() = default;

    /**
     * @brief Fetch and remove the orphan snapshot for the specified ID
     * @param id Component ID
     * @param outSnapshot Output parameter; returns the found component snapshot
     * @return true if found, false otherwise
     * @remark The snapshot is automatically removed from the orphan collection after a successful fetch
     */
    virtual bool takeOrphanSnapshot(const std::string& id, ComponentSnapshot& outSnapshot) = 0;
};

/**
 * @brief Virtual DOM node
 * @remark Used to build a tree structure of components
 */
class VirtualDOMNode {
public:
    /**
     * @brief Constructor
     * @param id Node ID
     * @param observer Virtual DOM observer
     * @param orphanFetcher Orphan snapshot fetcher
     */
    VirtualDOMNode(const std::string& id, IVirtualDOMObserver* observer, IOrphanSnapshotFetcher* orphanFetcher);

    /**
     * @brief Destructor
     */
    ~VirtualDOMNode();


    /**
     * @brief Get the node ID
     * @return Node ID
     */
    const std::string& getId() const;

    /**
     * @brief Check whether the node has a snapshot
     * @return true if a snapshot exists, false otherwise
     */
    bool hasSnapshot() const;

    /**
     * @brief Get the component snapshot
     * @return Snapshot pointer; nullptr if no snapshot exists
     */
    const ComponentSnapshot* getSnapshot() const { return _snapshot.get(); }

    /**
     * @brief Set the component snapshot
     * @param snapshot Component snapshot
     * @param parentId Parent node ID
     */
    void setSnapshot(const ComponentSnapshot& snapshot, const std::string& parentId);

    /**
     * @brief Get all child nodes
     * @return Child node array
     */
    const std::vector<std::shared_ptr<VirtualDOMNode>>& getChildren() const;

#if defined(__OHOS__)
    /**
     * @brief Get the Yoga layout node
     * @return Yoga node reference
     */
    YGNodeRef getYogaNode() const { return _yogaNode; }

    /**
     * @brief Set the Yoga node dimensions
     * @param width Width
     * @param height Height
     * @remark Used to dynamically update component dimensions, e.g., after Markdown rendering completes
     */
    void setYogaNodeSize(float width, float height);
#endif

    /**
     * @brief Check and notify layout changes
     * @remark Recursively checks the current node and its children for layout changes and notifies the observer
     */
    void checkAndNotifyLayoutChanges();

    /**
     * @brief Refresh child nodes level by level
     * @remark Updates the node's own children first, then recursively refreshes child nodes
     */
    void refreshChildrenRecursively();

    /**
     * @brief Find a child node by ID
     * @param id Node ID
     * @return Shared pointer to the child node; nullptr if not found
     */
    std::shared_ptr<VirtualDOMNode> findChild(const std::string& id) const;

private:
#if defined(__OHOS__)
    /**
     * @brief Log Yoga layout results and applied style properties for the current node
     * @param snapshotWithLayout Snapshot copy populated with layout info
     */
    void logYogaLayoutInfo(const ComponentSnapshot& snapshotWithLayout) const;
#endif
    /**
     * @brief Notify the observer of a component update
     * @param newSnapshot New component snapshot
     */
    void notifyComponentUpdate(const ComponentSnapshot& newSnapshot);

    /**
     * @brief Notify the observer that a component was added
     * @param parentId Parent node ID
     */
    void notifyComponentAdded();

    /**
     * @brief Notify the observer that a component was removed
     */
    void notifyComponentRemoved();

    /**
     * @brief Update the child node list to match _snapshot->children
     * @remark Synchronizes both _children and the Yoga child nodes
     */
    void updateChildren();

#if defined(__OHOS__)

    /**
     * @brief Set up a measure function for components that need intrinsic sizing
     * @remark Called before convertYogaStyles; determines whether intrinsic measurement is needed
     */
    void setupMeasureFunctionIfNeeded();

    /**
     * @brief Save width/height from snapshot.styles into layout.styleInfo before Yoga conversion
     * @remark Only applies to Image components; must be called before convertToYoga with clearAfterConvert=true
     */
    void saveImageStyleInfo();

    /**
     * @brief Yoga measure function callback
     * @param node Yoga node
     * @param width Available width
     * @param widthMode Width mode
     * @param height Available height
     * @param heightMode Height mode
     * @return Computed size
     */
    static YGSize measureFunction(
        YGNodeRef node,
        float width,
        YGMeasureMode widthMode,
        float height,
        YGMeasureMode heightMode);

    /**
     * @brief Compute the intrinsic size of a text component
     * @param snapshot Component snapshot
     * @param width Available width from Yoga
     * @param widthMode Yoga width mode
     * @return Computed size
     */
    YGSize measureTextComponent(const ComponentSnapshot& snapshot, float width, YGMeasureMode widthMode, int& lines) const;

    /**
     * @brief Compute the intrinsic size of an image component
     * @param snapshot Component snapshot
     * @return Computed size
     */
    YGSize measureImageComponent(const ComponentSnapshot& snapshot, float maxWidth, YGMeasureMode widthMode, float maxHeight, YGMeasureMode heightMode) const;

    /**
     * @brief Compute the intrinsic size of a Lottie component
     * @param snapshot Component snapshot
     * @param maxWidth Maximum width
     * @param widthMode Width mode
     * @param maxHeight Maximum height
     * @param heightMode Height mode
     * @return Computed size
     */
    YGSize measureLottieComponent(const ComponentSnapshot& snapshot, float maxWidth, YGMeasureMode widthMode, float maxHeight, YGMeasureMode heightMode) const;

    /**
     * @brief Compute the intrinsic size of a Chart component
     * @param snapshot Component snapshot
     * @param maxWidth Maximum width
     * @param widthMode Width mode
     * @param maxHeight Maximum height
     * @param heightMode Height mode
     * @return Computed size
     */
    YGSize measureChartComponent(const ComponentSnapshot& snapshot, float maxWidth, YGMeasureMode widthMode, float maxHeight, YGMeasureMode heightMode) const;

    /**
     * @brief Compute the intrinsic size of a Slider component
     * @param snapshot Component snapshot
     * @param maxWidth Maximum width
     * @param widthMode Width mode
     * @param maxHeight Maximum height
     * @param heightMode Height mode
     * @return Computed size
     */
    YGSize measureSliderComponent(const ComponentSnapshot& snapshot, float maxWidth, YGMeasureMode widthMode, float maxHeight, YGMeasureMode heightMode) const;

    /**
     * @brief Compute the intrinsic size of a DateTimeInput component
     * @param snapshot Component snapshot
     * @param maxWidth Maximum width
     * @param widthMode Width mode
     * @param maxHeight Maximum height
     * @param heightMode Height mode
     * @return Computed size
     */
    YGSize measureDateTimeInputComponent(const ComponentSnapshot& snapshot, float maxWidth, YGMeasureMode widthMode, float maxHeight, YGMeasureMode heightMode) const;

    /**
     * @brief Initialize Yoga layout for the Divider component
     * @remark Sets Divider width/height based on the thickness and axis attributes
     */
    void setupDividerLayout();

    /**
     * @brief Initialize Yoga layout for the Button component
     */
    void setupButtonLayout();

    /**
     * @brief Initialize Yoga layout for the Table component
     * @remark Builds the internal Table Yoga tree and mounts it to the current node
     */
    void setupTableLayout();

    /**
     * @brief Initialize Yoga layout for the ChoicePicker component
     * @remark Builds the internal ChoicePicker Yoga tree and mounts it to the current node
     */
    void setupChoicePickerLayout();

    /**
     * @brief Initialize Yoga layout for the Tabs component
     * @remark Builds the internal Tabs Yoga tree and mounts it to the current node
     */
    void setupTabsLayout();

    /**
     * @brief Initialize Yoga layout for the AudioPlayer component
     * @remark Builds the internal AudioPlayer Yoga tree and mounts it to the current node
     */
    void setupAudioPlayerLayout();

    /**
     * @brief Initialize Yoga layout for the CheckBox component
     * @remark Builds a Row(checkbox + text) internal Yoga tree, aligned with ARKUI_NODE_ROW on HarmonyOS
     */
    void setupCheckBoxLayout();

    /**
     * @brief Yoga measure callback for the CheckBox internal text node
     */
    static YGSize checkBoxTextMeasureFunc(
        YGNodeRef node, float width, YGMeasureMode widthMode,
        float height, YGMeasureMode heightMode);

#endif

    /**
     * @brief Compare two component snapshots for changes (ignoring the children field)
     * @param snapshot1 First component snapshot
     * @param snapshot2 Second component snapshot
     * @param compareLayout Whether to compare the layout field
     * @param diff Output parameter; returns diff info (optional, default nullptr)
     * @return true if changed, false otherwise
     */
    static bool checkSnapshotChanged(const ComponentSnapshot& snapshot1, const ComponentSnapshot& snapshot2, bool compareLayout, std::string* diff = nullptr);

private:
    std::string _id;                                                                        // Node ID
    std::string _parentId;                                                                  // Parent node ID
    VirtualDOMNode* _parent = nullptr;                                                      // Parent node pointer (non-owning)
    std::shared_ptr<ComponentSnapshot> _snapshot;                                           // Raw component snapshot (before Yoga layout)
    std::shared_ptr<ComponentSnapshot> _snapshotWithLayout;                                 // Component snapshot (with Yoga layout info filled in)
    std::vector<std::shared_ptr<VirtualDOMNode>> _children;                                 // Child node list
    IVirtualDOMObserver* _observer;                                                         // Virtual DOM observer
    IOrphanSnapshotFetcher* _orphanFetcher;                                                 // Orphan snapshot fetcher
#if defined(__OHOS__)
    YGNodeRef _yogaNode = nullptr;                                                          // Yoga layout node
    std::shared_ptr<IVirtualDomTable> _table;                                               // Table component Yoga tree builder
    std::shared_ptr<IvirtualDomChoicePicker> _choicePicker;                                 // ChoicePicker component Yoga tree builder
    std::shared_ptr<IvirtualDomTabs> _tabsPicker;                                           // Tabs component Yoga tree builder
#endif
};

}  // namespace agenui
