#include "agenui_a2ui_attribute_converter.h"

namespace agenui {

#if defined(__OHOS__)

void A2UIAttributeConverter::convertToYoga(ComponentSnapshot& snapshot, YGNodeRef yogaNode, bool clearAfterConvert) {
    if (yogaNode == nullptr) {
        return;
    }
    
    // Handle direction attribute (maps to flex-direction)
    {
        auto attrIt = snapshot.attributes.find(A2UIPropertyNames::kDirection);
        if (attrIt != snapshot.attributes.end()) {
            applyFlexDirection(yogaNode, attrIt->second, snapshot);
        } else {
            // Set flex-direction based on component type even if not explicitly specified
            applyFlexDirection(yogaNode, SerializableData(), snapshot);
        }
    }

    // Handle justify attribute (maps to justify-content)
    {
        auto attrIt = snapshot.attributes.find(A2UIPropertyNames::kJustify);
        if (attrIt != snapshot.attributes.end()) {
            applyJustifyContent(yogaNode, attrIt->second);
        }
    }

    // Handle align attribute (maps to align-items)
    {
        auto attrIt = snapshot.attributes.find(A2UIPropertyNames::kAlign);
        if (attrIt != snapshot.attributes.end()) {
            applyAlignItems(yogaNode, attrIt->second);
        }
    }

    // Handle weight attribute (maps to flex-grow)
    {
        auto attrIt = snapshot.attributes.find(A2UIPropertyNames::kWeight);
        if (attrIt != snapshot.attributes.end()) {
            applyFlexGrow(yogaNode, attrIt->second);
        }
    }

    if (clearAfterConvert) {
//        snapshot.attributes.erase(A2UIPropertyNames::kDirection);
        snapshot.attributes.erase(A2UIPropertyNames::kJustify);
//        snapshot.attributes.erase(A2UIPropertyNames::kAlign);
        snapshot.attributes.erase(A2UIPropertyNames::kWeight);
    }
}

void A2UIAttributeConverter::applyFlexDirection(YGNodeRef yogaNode, const SerializableData& value, ComponentSnapshot& snapshot) {
    if (yogaNode == nullptr) {
        return;
    }
    
    // Component type takes priority
    if (snapshot.component == "Row") {
        YGNodeStyleSetFlexDirection(yogaNode, YGFlexDirectionRow);
    } else if (snapshot.component == "Column") {
        YGNodeStyleSetFlexDirection(yogaNode, YGFlexDirectionColumn);
    } else if (!value.asString().empty()) {
        // For other component types, use the explicitly set value
        std::string actualValue = value.asString();
        if (actualValue == "horizontal") {
            YGNodeStyleSetFlexDirection(yogaNode, YGFlexDirectionRow);
            YGNodeStyleSetAlignItems(yogaNode, YGAlignCenter);
            YGNodeStyleSetAlignContent(yogaNode, YGAlignCenter);
        } else if (actualValue == "vertical") {
            YGNodeStyleSetFlexDirection(yogaNode, YGFlexDirectionColumn);
            YGNodeStyleSetAlignItems(yogaNode, YGAlignCenter);
            YGNodeStyleSetAlignContent(yogaNode, YGAlignCenter);
        }
    } else if (!snapshot.children.empty()) {
        YGNodeStyleSetFlexDirection(yogaNode, YGFlexDirectionColumn);
    }
}

void A2UIAttributeConverter::applyJustifyContent(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    std::string actualValue = value.asString();
    
    if (actualValue == "start") {
        YGNodeStyleSetJustifyContent(yogaNode, YGJustifyFlexStart);
    } else if (actualValue == "center") {
        YGNodeStyleSetJustifyContent(yogaNode, YGJustifyCenter);
    } else if (actualValue == "end") {
        YGNodeStyleSetJustifyContent(yogaNode, YGJustifyFlexEnd);
    } else if (actualValue == "spaceBetween") {
        YGNodeStyleSetJustifyContent(yogaNode, YGJustifySpaceBetween);
    } else if (actualValue == "spaceAround") {
        YGNodeStyleSetJustifyContent(yogaNode, YGJustifySpaceAround);
    } else if (actualValue == "spaceEvenly") {
        YGNodeStyleSetJustifyContent(yogaNode, YGJustifySpaceEvenly);
    }
}

void A2UIAttributeConverter::applyAlignItems(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    std::string actualValue = value.asString();
    
    if (actualValue == "start") {
        YGNodeStyleSetAlignItems(yogaNode, YGAlignFlexStart);
    } else if (actualValue == "center") {
        YGNodeStyleSetAlignItems(yogaNode, YGAlignCenter);
    } else if (actualValue == "end") {
        YGNodeStyleSetAlignItems(yogaNode, YGAlignFlexEnd);
    } else if (actualValue == "stretch") {
        YGNodeStyleSetAlignItems(yogaNode, YGAlignStretch);
    }
}

void A2UIAttributeConverter::applyFlexGrow(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        YGNodeStyleSetFlexGrow(yogaNode, static_cast<float>(value.asDouble()));
        return;
    }
    
    std::string actualValue = value.asString();
    
    if (!actualValue.empty()) {
        float flexGrow = std::stof(actualValue);
        YGNodeStyleSetFlexGrow(yogaNode, flexGrow);
    }
}

#endif

}  // namespace agenui
