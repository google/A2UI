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

class IvirtualDomChoicePicker;
class VirtualDOMNode;

/**
 * @brief ChoicePicker cell data model
 */
class ChoicePickerUnitCell {
public:
    std::string text;                              // Option text (from the label field)
    int index = 0;                                 // Index in the options array
    IvirtualDomChoicePicker* _choicePicker = nullptr;  // Owning IvirtualDomChoicePicker object
    ComponentSnapshot snapshot;                    // Component snapshot (for style propagation)
};

/**
 * @brief ChoicePicker component Yoga node tree builder
 * @remark Holds the options array and builds the Yoga child node tree (supports horizontal/vertical layout)
 */
class IvirtualDomChoicePicker {
public:
    /**
     * @brief Constructor: parses the options array from ComponentSnapshot and initializes Yoga nodes
     * @param snapshot Component snapshot
     * @param measureTextFunc Text measurement callback (from VirtualDOMNode::measureTextComponent)
     */
    explicit IvirtualDomChoicePicker(
        const ComponentSnapshot& snapshot,
        const std::function<YGSize(const ComponentSnapshot&, float, int&)>& measureTextFunc,
        VirtualDOMNode* parentNode = nullptr);

    /**
     * @brief Destructor: releases the Yoga node tree
     */
    ~IvirtualDomChoicePicker();

    /**
     * @brief Get the option text at the specified index
     * @param index Option index
     * @return Option text
     */
    std::string getLabel(int index) const { return options[index]; }

    /**
     * @brief Get the root Yoga node
     * @return Yoga node reference
     */
    YGNodeRef getYogaNode() const { return _yogaNode; }

    /**
     * @brief Build the ChoicePicker Yoga child node tree
     */
    void creatCellYogaNode(float maxWidt);

    /**
     * @brief Yoga measure function callback (bound to each option node)
     */
    static YGSize measureChoicePickerFunction(
        YGNodeRef node,
        float width,
        YGMeasureMode widthMode,
        float height,
        YGMeasureMode heightMode);

    YGNodeRef _yogaNode = nullptr;                                           // Root Yoga node
    ComponentSnapshot snapshot;                                              // Component snapshot (passed to cells for style measurement)
    std::vector<std::string> options;                                        // Option text array (parsed from label field)
    std::vector<std::shared_ptr<ChoicePickerUnitCell>> cells;                // All cells (in linear order)
    bool orientationHorizontal = false;                                      // true=horizontal, false=vertical
    std::function<YGSize(const ComponentSnapshot&, float, int&)> _measureTextFunc;  // Text measurement callback
    float _maxWidth = 0.0f;                                          // Available max width (stored when creatCellYogaNode is called)
    VirtualDOMNode* _parentNode = nullptr;                           // Parent node (used to refresh snapshot in creatCellYogaNode)

private:
    /**
     * @brief Recursively free the Yoga node tree
     */
    void freeYogaTree(YGNodeRef node);

    /**
     * @brief Parse all picker data from snapshot (options/orientationHorizontal);
     *        clears related member variables before parsing
     */
    void parseSnapshot(const ComponentSnapshot& snapshot);

    /**
     * @brief Parse the options array from snapshot.attributes (extracts the label field)
     */
    void parseOptions(const ComponentSnapshot& snapshot);

    /**
     * @brief Parse the layout orientation from snapshot.styles
     */
    void parseOrientation(const ComponentSnapshot& snapshot);

    /**
     * @brief Create a Yoga node for a single option and bind a measure function
     */
    YGNodeRef createItemNode(const std::shared_ptr<ChoicePickerUnitCell>& cell);

    /**
     * @brief Apply styles (e.g. gap) to the row container node
     * @param rowNode Yoga node
     */
    void setRowNodeStyle(YGNodeRef rowNode);
};

}  // namespace agenui

#endif // __OHOS__
