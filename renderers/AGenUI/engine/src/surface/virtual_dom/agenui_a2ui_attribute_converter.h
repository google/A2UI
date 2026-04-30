#pragma once

#include "agenui_component_snapshot.h"
#include <string>

#if defined(__OHOS__)
#include <yoga/Yoga.h>
#endif

namespace agenui {

// Static mapping table of A2UI property names (A2UI spec naming)
namespace A2UIPropertyNames {
    // Common layout container properties
    static const char* kJustify = "justify";           // Main-axis alignment for Row/Column/List
    static const char* kAlign = "align";               // Cross-axis alignment for Row/Column/List
    static const char* kDirection = "direction";       // Layout direction for List
    static const char* kWeight = "weight";             // Relative weight within Row/Column (similar to flex-grow)

    // Table-specific properties
    static const char* kColumns = "columns";           // Table column definitions (column count = columns.size())
    static const char* kRows = "rows";                 // Table data rows (row count = rows.size())
    static const char* kAxis = "axis";                 // Divider axis (horizontal or vertical)
    static const char* kOptions = "options";           // ChoicePicker options array
    static const char* kTabs = "tabs";                 // Tabs label array

    // A2UI justify value enum
    namespace JustifyValues {
        static const char* kStart = "start";
        static const char* kCenter = "center";
        static const char* kEnd = "end";
        static const char* kSpaceBetween = "spaceBetween";
        static const char* kSpaceAround = "spaceAround";
        static const char* kSpaceEvenly = "spaceEvenly";
        static const char* kStretch = "stretch";
    }
    
    // A2UI align value enum
    namespace AlignValues {
        static const char* kStart = "start";
        static const char* kCenter = "center";
        static const char* kEnd = "end";
        static const char* kStretch = "stretch";
    }

    // A2UI direction value enum
    namespace DirectionValues {
        static const char* kVertical = "vertical";
        static const char* kHorizontal = "horizontal";
    }
}

#if defined(__OHOS__)

/**
 * @brief A2UI attribute converter
 * @remark Converts A2UI attributes in ComponentSnapshot to Yoga layout properties
 */
class A2UIAttributeConverter {
public:
    /**
     * @brief Convert A2UI attributes to Yoga layout properties
     * @param snapshot Component snapshot (input source)
     * @param yogaNode Yoga layout node (output target)
     * @param clearAfterConvert Whether to clear A2UI attributes from snapshot after conversion; defaults to false
     * @remark Processes A2UI-specific attributes (direction, justify, align, weight) from the attributes field
     */
    static void convertToYoga(ComponentSnapshot& snapshot, YGNodeRef yogaNode, bool clearAfterConvert = false);

private:
    // A2UI-specific apply functions (handle A2UI value formats and component type checks)
    static void applyFlexDirection(YGNodeRef yogaNode, const SerializableData& value, ComponentSnapshot& snapshot);
    static void applyJustifyContent(YGNodeRef yogaNode, const SerializableData& value);
    static void applyAlignItems(YGNodeRef yogaNode, const SerializableData& value);
    static void applyFlexGrow(YGNodeRef yogaNode, const SerializableData& value);
};
#endif

}  // namespace agenui
