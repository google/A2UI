#pragma once

#include "agenui_component_snapshot.h"
#include "agenui_css_style_converter.h"
#include "agenui_a2ui_attribute_converter.h"
#include <memory>
#include <vector>
#include <string>
#include <functional>

#if defined(__OHOS__)
#include <yoga/Yoga.h>

namespace agenui {

class IvirtualDomTabs;
class VirtualDOMNode;

/**
 * @brief Tabs cell data model
 */
class TabsUnitCell {
public:
    std::string text;                          // Tab label text (from the title field)
    int index = 0;                             // Index in the tabs array
    ComponentSnapshot cellSnap;
    IvirtualDomTabs* _tabsPicker = nullptr;    // Owning IvirtualDomTabs object
};

/**
 * @brief Tabs component Yoga node tree builder
 * @remark Holds the tab array and is responsible for building the Yoga child node tree (horizontal layout)
 */
class IvirtualDomTabs {
public:
    /**
     * @brief Constructor: parses the tab array from ComponentSnapshot and initializes Yoga nodes
     * @param snapshot Component snapshot
     * @param measureTextFunc Text measurement callback (from VirtualDOMNode::measureTextComponent)
     */
    explicit IvirtualDomTabs(
        const ComponentSnapshot& snapshot,
        const std::function<YGSize(const ComponentSnapshot&, float, int&)>& measureTextFunc,
        VirtualDOMNode* parentNode = nullptr);

    /**
     * @brief Destructor: releases the Yoga node tree
     */
    ~IvirtualDomTabs();

    /**
     * @brief Get the label text at the specified index
     * @param index Tab index
     * @return Tab label text
     */
    std::string getLabel(int index) const { return tabs[index]; }

    /**
     * @brief Get the root Yoga node
     * @return Yoga node reference
     */
    YGNodeRef getYogaNode() const { return _yogaNode; }

    /**
     * @brief Build the Tabs Yoga child node tree
     * @param maxWidth Available maximum width
     */
    void creatCellYogaNode(float maxWidth, float subHeight);

    /**
     * @brief Build the Tabs Yoga child node tree and locate the child node by id as the label ruler
     * @param maxWidth Available maximum width
     * @param id       Target child node id
     */
    void creatCellYogaNode(float maxWidth, const std::string& id);

    /**
     * @brief Yoga measure function callback (bound to each tab node)
     */
    static YGSize measureTabesFunction(
        YGNodeRef node,
        float width,
        YGMeasureMode widthMode,
        float height,
        YGMeasureMode heightMode);
   static YGSize measureTabesLabelFunction(
        YGNodeRef node,
        float width,
        YGMeasureMode widthMode,
        float height,
        YGMeasureMode heightMode);

    YGNodeRef _yogaNode = nullptr;                                          // Root Yoga node
    ComponentSnapshot snapshot;                                             // Component snapshot (passed to cells for style measurement)
    std::vector<std::string> tabs;                                          // Tab label text array (parsed from title field)
    std::vector<std::string> child;                                         // Child component ID array (parsed from child field)
    std::vector<std::shared_ptr<TabsUnitCell>> cells;                       // All cells (in linear order)
    std::shared_ptr<TabsUnitCell> subCell;                                  // Cell used for the label node
    float _maxWidth = 0.0f;                                                 // Available maximum width
    VirtualDOMNode* _parentNode = nullptr;                                  // Tabs parent node (used to locate child nodes)
    std::function<YGSize(const ComponentSnapshot&, float, int&)> _measureTextFunc;  // Text measurement callback
    /**
     * @brief Check whether the specified child component ID is contained
     * @param id Child component ID
     * @return true if contained
     */
    bool isContainChild(const std::string& id) const;

    /**
     * @brief Get the layout info of the last Label node
     * @return Layout info
     */
    LayoutInfo getLabelAbsolute() const;

private:
    /**
     * @brief Recursively free the Yoga node tree
     */
    void freeYogaTree(YGNodeRef node);

    /**
     * @brief Parse the tab array from snapshot.attributes (extracts title and child fields)
     */
    void parseTabs(const ComponentSnapshot& snapshot);

    /**
     * @brief Create a Yoga node for a single tab and bind a measure function
     */
    YGNodeRef createItemNode(const std::shared_ptr<TabsUnitCell>& cell);

    /**
     * @brief Apply Tab cell styles
     * @param cellNode Yoga node
     * @param cellSnap Component snapshot
     */
    void setTabCellStyle(YGNodeRef cellNode, ComponentSnapshot& cellSnap);

    /**
     * @brief Apply indicator cell styles
     * @param cellNode Yoga node
     */
    void setIndicatorCellStyle(YGNodeRef cellNode);

    /**
     * @brief Apply Label cell styles
     * @param cellNode Yoga node
     * @param cellSnap Component snapshot
     */
    void setLabelCellStyle(YGNodeRef cellNode, ComponentSnapshot& cellSnap);

    /**
     * @brief Find the child with the longest text among parent's children and create subCell with its style
     */
    void buildLabelFromChildren();

    /**
     * @brief Find the child node by the specified id and create subCell with its style
     * @param id Target child node id
     */
    void buildLabelFromChildren(const std::string& id);
};

}  // namespace agenui

#endif // __OHOS__
