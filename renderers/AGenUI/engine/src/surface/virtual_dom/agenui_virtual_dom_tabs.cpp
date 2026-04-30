#include "agenui_virtual_dom_tabs.h"
#include "agenui_virtual_dom_node.h"

#if defined(__OHOS__)

#include "agenui_css_style_converter.h"
#include "agenui_a2ui_attribute_converter.h"
#include "agenui_component_snapshot.h"
#include "nlohmann/json.hpp"
#include "surface/agenui_serializable_data_impl.h"

namespace agenui {

IvirtualDomTabs::IvirtualDomTabs(
    const ComponentSnapshot& snap,
    const std::function<YGSize(const ComponentSnapshot&, float, int&)>& measureTextFunc,
    VirtualDOMNode* parentNode) {
    _measureTextFunc = measureTextFunc;
    _parentNode = parentNode;
    snapshot = snap;
    parseTabs(snap);
    _yogaNode = YGNodeNew();
    YGNodeStyleSetFlexDirection(_yogaNode, YGFlexDirectionColumn);
    YGNodeStyleSetAlignItems(_yogaNode, YGAlignFlexStart);
    YGNodeStyleSetAlignContent(_yogaNode, YGAlignFlexStart);
}

IvirtualDomTabs::~IvirtualDomTabs() {
    if (_yogaNode) {
        freeYogaTree(_yogaNode);
        _yogaNode = nullptr;
    }
}

void IvirtualDomTabs::freeYogaTree(YGNodeRef node) {
    if (!node) return;
    uint32_t count = YGNodeGetChildCount(node);
    for (uint32_t i = 0; i < count; i++) {
        freeYogaTree(YGNodeGetChild(node, i));
    }
    YGNodeFree(node);
}

void IvirtualDomTabs::parseTabs(const ComponentSnapshot& snap) {
    // tabs attribute: JSON array; each element is either an object { "title": "...", "child": "..." } or a plain string
    tabs.clear();
    child.clear();
    auto it = snap.attributes.find(A2UIPropertyNames::kTabs);
    if (it == snap.attributes.end()) return;
    if (!it->second.isArray()) return;
    for (const auto& item : it->second) {
        if (item.isObject()) {
            // Parse the title field
            if (item.contains("title")) {
                const auto& titleVal = item["title"];
                tabs.push_back(titleVal.isString() ? titleVal.asString() : titleVal.dump());
            } else {
                tabs.push_back("");
            }
            
            // Parse the child field
            if (item.contains("child")) {
                const auto& childVal = item["child"];
                child.push_back(childVal.isString() ? childVal.asString() : childVal.dump());
            } else {
                child.push_back("");
            }
        } else if (item.isString()) {
            tabs.push_back(item.asString());
            child.push_back("");
        } else {
            tabs.push_back(item.dump());
            child.push_back("");
        }
    }
}

YGNodeRef IvirtualDomTabs::createItemNode(const std::shared_ptr<TabsUnitCell>& cell) {
    YGNodeRef itemNode = YGNodeNew();
    
    // Create ComponentSnapshot and apply styles
    cell->cellSnap.component = "Text";
    cell->cellSnap.attributes["text"] = SerializableData(SerializableData::Impl::create(cell->text));
    
    // Apply styles via setTabCellStyle
    setTabCellStyle(itemNode,  cell->cellSnap);
    YGNodeSetContext(itemNode, cell.get());
    YGNodeSetMeasureFunc(itemNode, measureTabesFunction);
    if (YGNodeHasMeasureFunc(itemNode)) {
        YGNodeMarkDirty(itemNode);
    }
    return itemNode;
}

void IvirtualDomTabs::creatCellYogaNode(float maxWidth, float subHeight) {
    _maxWidth = maxWidth;
    if(!_parentNode && !_parentNode->getSnapshot()) {
        return;
    }
    snapshot = *_parentNode->getSnapshot();
    parseTabs(snapshot);

    while (YGNodeGetChildCount(_yogaNode) > 0) {
        YGNodeRef child = YGNodeGetChild(_yogaNode, 0);
        YGNodeRemoveChild(_yogaNode, child);
        freeYogaTree(child);
    }
    cells.clear();

    // Create a Row container with all tabs arranged horizontally
    YGNodeRef rowNode = YGNodeNew();

    for (int i = 0; i < (int)tabs.size(); i++) {
        auto cell = std::make_shared<TabsUnitCell>();
        cell->text = tabs[i];
        cell->index = i;
        cell->_tabsPicker = this;
        cells.push_back(cell);

        YGNodeInsertChild(rowNode, createItemNode(cell), static_cast<uint32_t>(i));
    }
    YGNodeInsertChild(_yogaNode, rowNode, 0);

    YGNodeRef indicatorNode = YGNodeNew();
    YGNodeStyleSetHeight(indicatorNode, subHeight);
    YGNodeInsertChild(_yogaNode, indicatorNode, 1);
    YGNodeCalculateLayout(_yogaNode, YGUndefined, YGUndefined, YGDirectionLTR);
}

void IvirtualDomTabs::creatCellYogaNode(float maxWidth, const std::string& id) {
    _maxWidth = maxWidth;
    if(!_parentNode && !_parentNode->getSnapshot()) {
        return;
    }
    snapshot = *_parentNode->getSnapshot();
    parseTabs(snapshot);

    // Remove old child nodes
    while (YGNodeGetChildCount(_yogaNode) > 0) {
        YGNodeRef childRef = YGNodeGetChild(_yogaNode, 0);
        YGNodeRemoveChild(_yogaNode, childRef);
        freeYogaTree(childRef);
    }
    cells.clear();

    // Create a Row container with all tabs arranged horizontally
    YGNodeRef rowNode = YGNodeNew();
    for (int i = 0; i < (int)tabs.size(); i++) {
        auto cell = std::make_shared<TabsUnitCell>();
        cell->text = tabs[i];
        cell->index = i;
        cell->_tabsPicker = this;
        cells.push_back(cell);
        YGNodeInsertChild(rowNode, createItemNode(cell), static_cast<uint32_t>(i));
    }
    YGNodeInsertChild(_yogaNode, rowNode, 0);
    YGNodeCalculateLayout(_yogaNode, YGUndefined, YGUndefined, YGDirectionLTR);
}

void IvirtualDomTabs::buildLabelFromChildren() {
    if (!_parentNode || child.empty() || !_measureTextFunc) return;

    // Measure each child via _measureTextFunc and find the tallest one
    const ComponentSnapshot* tallestSnap = nullptr;
    float tallestHeight = -1.0f;

    for (const auto& childId : child) {
        if (childId.empty()) continue;
        auto childNode = _parentNode->findChild(childId);
        if (!childNode || !childNode->hasSnapshot()) continue;
        const ComponentSnapshot* cs = childNode->getSnapshot();
        if (!cs) continue;

        int dummyLines = 0;
        YGSize size = _measureTextFunc(*cs, _maxWidth, dummyLines);
        if (size.height > tallestHeight) {
            tallestHeight = size.height;
            tallestSnap = cs;
        }
    }

    if (tallestSnap) {
        // Create subCell using the style of the tallest child
        subCell = std::make_shared<TabsUnitCell>();
        subCell->cellSnap = *tallestSnap;
        subCell->_tabsPicker = this;
    }
}

void IvirtualDomTabs::buildLabelFromChildren(const std::string& id) {
    if (!_parentNode || id.empty()) return;

    // Look up the child node directly by the given id
    auto childNode = _parentNode->findChild(id);
    if (!childNode || !childNode->hasSnapshot()) return;
    const ComponentSnapshot* cs = childNode->getSnapshot();
    if (!cs) return;

    subCell = std::make_shared<TabsUnitCell>();
    subCell->cellSnap = *cs;
    subCell->_tabsPicker = this;
}

YGSize IvirtualDomTabs::measureTabesFunction(
    YGNodeRef node,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode) {

    TabsUnitCell* cell = static_cast<TabsUnitCell*>(YGNodeGetContext(node));
    if (!cell || !cell->_tabsPicker) {
        return {0.0f, 0.0f};
    }
    IvirtualDomTabs* picker = cell->_tabsPicker;

    if (picker->_measureTextFunc) {
        ComponentSnapshot itemSnap = cell->cellSnap;
        itemSnap.component = "Tabs";
        itemSnap.attributes["text"] = SerializableData(SerializableData::Impl::create(cell->text));
        int dummyLines = 0;
        return picker->_measureTextFunc(itemSnap, width, dummyLines);
    }
    return {width, 0.0f};
}

YGSize IvirtualDomTabs::measureTabesLabelFunction(
    YGNodeRef node,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode) {

    TabsUnitCell* cell = static_cast<TabsUnitCell*>(YGNodeGetContext(node));
    if (!cell || !cell->_tabsPicker) {
        return {0.0f, 0.0f};
    }
    IvirtualDomTabs* picker = cell->_tabsPicker;

    if (picker->_measureTextFunc) {
        ComponentSnapshot itemSnap = cell->cellSnap;
        itemSnap.component = "Tabs";
        int dummyLines = 0;
        return picker->_measureTextFunc(itemSnap, width, dummyLines);
    }
    return {width, 0.0f};
}

void IvirtualDomTabs::setTabCellStyle(YGNodeRef cellNode, ComponentSnapshot& cellSnap) {
    const nlohmann::json& componentStyles = CSSStyleConverter::getDeviceComponentStylesJson();
    if (!componentStyles.contains("Tabs") || !componentStyles["Tabs"].is_object()) {
        return;
    }

    const nlohmann::json& tabsStyles = componentStyles["Tabs"];

    // Helper: safely get a string value
    auto getStringValue = [&](const std::string& key) -> std::string {
        if (!tabsStyles.contains(key)) {
            return "";
        }
        const auto& value = tabsStyles[key];
        if (value.is_string()) {
            return value.get<std::string>();
        } else if (value.is_number()) {
            return std::to_string(value.get<double>());
        } else if (value.is_boolean()) {
            return value.get<bool>() ? "true" : "false";
        }
        return "";
    };
}

void IvirtualDomTabs::setIndicatorCellStyle(YGNodeRef cellNode) {
    const nlohmann::json& componentStyles = CSSStyleConverter::getDeviceComponentStylesJson();
    if (!componentStyles.contains("Tabs") || !componentStyles["Tabs"].is_object()) {
        return;
    }

    const nlohmann::json& tabsStyles = componentStyles["Tabs"];

    // Helper: safely get a string value
    auto getStringValue = [&](const std::string& key) -> std::string {
        if (!tabsStyles.contains(key)) {
            return "";
        }
        const auto& value = tabsStyles[key];
        if (value.is_string()) {
            return value.get<std::string>();
        } else if (value.is_number()) {
            return std::to_string(value.get<double>());
        } else if (value.is_boolean()) {
            return value.get<bool>() ? "true" : "false";
        }
        return "";
    };
}

void IvirtualDomTabs::setLabelCellStyle(YGNodeRef cellNode, ComponentSnapshot& cellSnap) {
    setTabCellStyle(cellNode, cellSnap);
}

bool IvirtualDomTabs::isContainChild(const std::string& id) const {
    for (const auto& childId : child) {
        if (childId == id) {
            return true;
        }
    }
    return false;
}

LayoutInfo IvirtualDomTabs::getLabelAbsolute() const {
    LayoutInfo info;
    if (_yogaNode && YGNodeGetChildCount(_yogaNode) > 1) {
        YGNodeRef labelNode = YGNodeGetChild(_yogaNode, 0);
        if (labelNode) {
            info.x = YGNodeLayoutGetLeft(labelNode);
            info.y = YGNodeLayoutGetTop(labelNode);
            info.width = YGNodeLayoutGetWidth(labelNode);
            info.height = YGNodeLayoutGetHeight(labelNode);
        }
    }
    return info;
}

}  // namespace agenui

#endif // __OHOS__
