#include "agenui_virtual_dom_choice_picker.h"
#include "agenui_virtual_dom_node.h"

#if defined(__OHOS__)

#include "agenui_css_style_converter.h"
#include "agenui_a2ui_attribute_converter.h"
#include "agenui_component_snapshot.h"
#include "nlohmann/json.hpp"
#include "surface/agenui_serializable_data_impl.h"

namespace agenui {

IvirtualDomChoicePicker::IvirtualDomChoicePicker(
    const ComponentSnapshot& snap,
    const std::function<YGSize(const ComponentSnapshot&, float, int&)>& measureTextFunc,
    VirtualDOMNode* parentNode) {
    _measureTextFunc = measureTextFunc;
    _parentNode = parentNode;
    parseSnapshot(snap);

    _yogaNode = YGNodeNew();
    YGNodeStyleSetFlexDirection(_yogaNode, YGFlexDirectionRow);
    YGNodeStyleSetAlignItems(_yogaNode, YGAlignFlexStart);

}

IvirtualDomChoicePicker::~IvirtualDomChoicePicker() {
    if (_yogaNode) {
        freeYogaTree(_yogaNode);
        _yogaNode = nullptr;
    }
}

void IvirtualDomChoicePicker::freeYogaTree(YGNodeRef node) {
    if (!node) return;
    uint32_t count = YGNodeGetChildCount(node);
    for (uint32_t i = 0; i < count; i++) {
        freeYogaTree(YGNodeGetChild(node, i));
    }
    YGNodeFree(node);
}

void IvirtualDomChoicePicker::parseSnapshot(const ComponentSnapshot& snap) {
    // Clear all parse results first to avoid stale data on re-parse
    options.clear();
    orientationHorizontal = false;

    snapshot = snap;
    parseOptions(snap);
    parseOrientation(snap);
}

void IvirtualDomChoicePicker::parseOptions(const ComponentSnapshot& snap) {
    // options attribute: JSON array; each element is an object { "label": "..." } or a plain string
    auto it = snap.attributes.find(A2UIPropertyNames::kOptions);
    if (it == snap.attributes.end()) return;
    if (!it->second.isArray()) return;
    for (const auto& item : it->second) {
        if (item.isObject() && item.contains("label")) {
            const auto& labelVal = item["label"];
            options.push_back(labelVal.isString() ? labelVal.asString() : labelVal.dump());
        } else if (item.isString()) {
            options.push_back(item.asString());
        } else {
            options.push_back(item.dump());
        }
    }
}

void IvirtualDomChoicePicker::parseOrientation(const ComponentSnapshot& snap) {
    auto it = snap.styles.find(CSSPropertyNames::kOrientation);
    if (it == snap.styles.end()) return;
    std::string val;
    if (it->second.isString()) {
        val = it->second.asString();
    } else {
        val = it->second.dump();
    }
    orientationHorizontal = (val == "horizontal");
}

YGNodeRef IvirtualDomChoicePicker::createItemNode(const std::shared_ptr<ChoicePickerUnitCell>& cell) {
    // Create itemNode (Row layout, aligned with ARKUI_NODE_ROW on HarmonyOS)
    YGNodeRef itemNode = YGNodeNew();
    YGNodeStyleSetFlexDirection(itemNode, YGFlexDirectionRow);

    const nlohmann::json& componentStyles = CSSStyleConverter::getDeviceComponentStylesJson();

    // Helper: safely get a string value
    auto getStringValue = [&](const std::string& key) -> std::string {
        if (!componentStyles.contains("ChoicePicker") || !componentStyles["ChoicePicker"].is_object()) {
            return "";
        }
        const nlohmann::json& pickerStyles = componentStyles["ChoicePicker"];
        if (!pickerStyles.contains(key)) {
            return "";
        }
        const auto& value = pickerStyles[key];
        if (value.is_string()) {
            return value.get<std::string>();
        } else if (value.is_number()) {
            return std::to_string(value.get<double>());
        } else if (value.is_boolean()) {
            return value.get<bool>() ? "true" : "false";
        }
        return "";
    };
    
    // Create checkbox node
    YGNodeRef checkbox = YGNodeNew();

    // checkbox-size -> width and height
    std::string checkboxSize = getStringValue("checkbox-size");
    if (!checkboxSize.empty()) {
        SerializableData styleValue(SerializableData::Impl::create(checkboxSize));
        CSSStyleConverter::applyWidth(checkbox, styleValue, false);
        CSSStyleConverter::applyHeight(checkbox, styleValue, false);
    }

    // checkbox-border-width -> border-width
    std::string checkboxBorderWidth = getStringValue("checkbox-border-width");
    if (!checkboxBorderWidth.empty()) {
        CSSStyleConverter::applyBorderWidth(checkbox, SerializableData(SerializableData::Impl::create(checkboxBorderWidth)));
    }
    YGNodeInsertChild(itemNode, checkbox, 0);

    // Create text node
    YGNodeRef text = YGNodeNew();

    cell->snapshot.component = "Text";
    cell->snapshot.attributes["text"] = SerializableData(SerializableData::Impl::create(cell->text));

    // text-size -> font-size
    std::string textSize = getStringValue("text-size");
    if (!textSize.empty()) {
        cell->snapshot.styles["font-size"] = SerializableData(SerializableData::Impl::create(textSize));
    }

    // text-margin -> margin
    std::string textMargin = getStringValue("text-margin");
    if (!textMargin.empty()) {
        CSSStyleConverter::applyMargin(text, SerializableData(SerializableData::Impl::create(textMargin)));
    }

    YGNodeSetContext(text, cell.get());
    YGNodeSetMeasureFunc(text, measureChoicePickerFunction);
    if (YGNodeHasMeasureFunc(text)) {
        YGNodeMarkDirty(text);
    }

    YGNodeInsertChild(itemNode, text, 1);

    return itemNode;
}

void IvirtualDomChoicePicker::setRowNodeStyle(YGNodeRef rowNode) {
    const nlohmann::json& componentStyles = CSSStyleConverter::getDeviceComponentStylesJson();
    if (!componentStyles.contains("ChoicePicker") || !componentStyles["ChoicePicker"].is_object()) {
        return;
    }

    const nlohmann::json& pickerStyles = componentStyles["ChoicePicker"];

    // Helper: safely get a string value
    auto getStringValue = [&](const std::string& key) -> std::string {
        if (!pickerStyles.contains(key)) {
            return "";
        }
        const auto& value = pickerStyles[key];
        if (value.is_string()) {
            return value.get<std::string>();
        } else if (value.is_number()) {
            return std::to_string(value.get<double>());
        } else if (value.is_boolean()) {
            return value.get<bool>() ? "true" : "false";
        }
        return "";
    };
    
    // choice-gap -> gap
    std::string choiceGap = getStringValue("choice-gap");
    if (!choiceGap.empty()) {
        CSSStyleConverter::applyGap(rowNode, SerializableData(SerializableData::Impl::create(choiceGap)));
    }
}

void IvirtualDomChoicePicker::creatCellYogaNode(float maxWidth) {
    _maxWidth = maxWidth;
    if (!_parentNode || !_parentNode->getSnapshot()) {
        return;
    }
    snapshot = *_parentNode->getSnapshot();
    parseSnapshot(snapshot);

    // Remove old child nodes
    while (YGNodeGetChildCount(_yogaNode) > 0) {
        YGNodeRef child = YGNodeGetChild(_yogaNode, 0);
        YGNodeRemoveChild(_yogaNode, child);
        freeYogaTree(child);
    }
    cells.clear();

    if (orientationHorizontal) {
        // Horizontal: place all options in a single Row container (no fixed width, wrap_content)
        YGNodeRef rowNode = YGNodeNew();
        YGNodeStyleSetFlexDirection(rowNode, YGFlexDirectionRow);
        YGNodeStyleSetAlignItems(rowNode, YGAlignFlexStart);
        setRowNodeStyle(rowNode);

        for (int i = 0; i < (int)options.size(); i++) {
            auto cell = std::make_shared<ChoicePickerUnitCell>();
            cell->text = options[i];
            cell->index = i;
            cell->_choicePicker = this;
            cells.push_back(cell);
            YGNodeInsertChild(rowNode, createItemNode(cell), static_cast<uint32_t>(i));
        }
        YGNodeInsertChild(_yogaNode, rowNode, 0);
    } else {
        // Vertical: each option occupies its own row in a Column container (no fixed width, wrap_content)
        YGNodeRef rowNode = YGNodeNew();
        YGNodeStyleSetFlexDirection(rowNode, YGFlexDirectionColumn);
        YGNodeStyleSetAlignItems(rowNode, YGAlignFlexStart);
        setRowNodeStyle(rowNode);
        for (int i = 0; i < (int)options.size(); i++) {
            auto cell = std::make_shared<ChoicePickerUnitCell>();
            cell->text = options[i];
            cell->index = i;
            cell->_choicePicker = this;
            cells.push_back(cell);
            YGNodeInsertChild(rowNode, createItemNode(cell), static_cast<uint32_t>(i));
        }
        YGNodeInsertChild(_yogaNode, rowNode, 0);

    }
    YGNodeCalculateLayout(_yogaNode, YGUndefined, YGUndefined, YGDirectionLTR);
}

YGSize IvirtualDomChoicePicker::measureChoicePickerFunction(
    YGNodeRef node,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode) {

    ChoicePickerUnitCell* cell = static_cast<ChoicePickerUnitCell*>(YGNodeGetContext(node));
    if (!cell || !cell->_choicePicker) {
        return {0.0f, 0.0f};
    }
    IvirtualDomChoicePicker* picker = cell->_choicePicker;

    if (picker->_measureTextFunc) {
        ComponentSnapshot itemSnap = cell->snapshot;
        itemSnap.component = "ChoicePicker";
        itemSnap.attributes["label"] = SerializableData(SerializableData::Impl::create(cell->text));
        int dummyLines = 0;
        return picker->_measureTextFunc(itemSnap, width, dummyLines);
    }
    return {width, 0.0f};
}

}  // namespace agenui

#endif // __OHOS__
