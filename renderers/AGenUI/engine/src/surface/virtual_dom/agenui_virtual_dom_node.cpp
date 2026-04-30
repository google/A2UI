#include "agenui_virtual_dom_node.h"
#include "agenui_css_style_converter.h"
#include "agenui_a2ui_attribute_converter.h"
#include "agenui_ivirtual_define.h"
#include "agenui_platform_layout_bridge.h"
#include "surface/style_defaults/agenui_style_defaults.h"
#include "agenui_log.h"
#include "surface/agenui_serializable_data_impl.h"
#include <climits>
#include <functional>
#include "nlohmann/json.hpp"
#if defined(__OHOS__)
#include "layout/key_define.h"
#endif

namespace agenui {

using namespace agenui;

namespace {

std::string parseSnapshotValue(const SerializableData& rawValue) {
    if (!rawValue.isValid()) {
        return "";
    }
    
    if (rawValue.isString()) {
        return rawValue.asString();
    }
    if (rawValue.isNumber()) {
        return std::to_string(rawValue.asDouble());
    }
    if (rawValue.isBool()) {
        return rawValue.asBool() ? "true" : "false";
    }

    return rawValue.dump();
}

}  // namespace

VirtualDOMNode::VirtualDOMNode(const std::string& id, IVirtualDOMObserver* observer, IOrphanSnapshotFetcher* orphanFetcher) : _id(id), _snapshot(nullptr), _observer(observer), _orphanFetcher(orphanFetcher) {
#if defined(__OHOS__)
    _yogaNode = YGNodeNew();
#endif
}

VirtualDOMNode::~VirtualDOMNode() {
    notifyComponentRemoved();
#if defined(__OHOS__)
    if (_yogaNode != nullptr) {
        YGNodeFree(_yogaNode);
        _yogaNode = nullptr;
    }
#endif
}

const std::string& VirtualDOMNode::getId() const {
    return _id;
}

bool VirtualDOMNode::hasSnapshot() const {
    return _snapshot != nullptr;
}

void VirtualDOMNode::setSnapshot(const ComponentSnapshot& snapshot, const std::string& parentId) {
    if (snapshot.id != _id) {
        return;
    }

    _parentId = parentId;

    // 1. Save the raw snapshot (before Yoga layout).
    //    _snapshot always holds the original incoming data without Yoga-computed layout info,
    //    and serves as the input source for subsequent Yoga layout calculations.
    if (!_snapshot) {
        _snapshot = std::make_shared<ComponentSnapshot>(snapshot);
#if defined(__OHOS__)
        YGNodeSetHasNewLayout(_yogaNode, true);
#endif
#if !defined(__OHOS__)
        checkAndNotifyLayoutChanges();
#endif
    } else if (VirtualDOMNode::checkSnapshotChanged(*_snapshot, snapshot, false)) {
        // Snapshot changed: update the raw snapshot (layout field is not compared)
        *_snapshot = snapshot;
#if defined(__OHOS__)
        YGNodeSetHasNewLayout(_yogaNode, true);
#endif
#if !defined(__OHOS__)
        checkAndNotifyLayoutChanges();
#endif
    }

    // 2. Update the child node list to match snapshot.children, preserving order
    updateChildren();

#if defined(__OHOS__)
    // 3. Set up measure functions for components that need intrinsic sizing
    //    (must be called before convertToYoga so the hasMeasureFunc check works correctly)
    setupMeasureFunctionIfNeeded();

    // 3.5 Save Image component width/height from styles into layout.styleInfo
    //     before convertToYoga clears the styles (clearAfterConvert=true)
    saveImageStyleInfo();

    // 4. Apply Yoga layout conversion: translate CSS styles and A2UI attributes to Yoga layout properties
    //    Note: clearAfterConvert=true will clear already-converted properties from _snapshot->styles
    CSSStyleConverter::convertToYoga(*_snapshot, _yogaNode, true);
    A2UIAttributeConverter::convertToYoga(*_snapshot, _yogaNode, true);
#endif
}

#if defined(__OHOS__)
void VirtualDOMNode::saveImageStyleInfo() {
    if (!_snapshot || _snapshot->component != "Image") {
        return;
    }
    nlohmann::json styleJson;
    auto widthIt = _snapshot->styles.find("width");
    if (widthIt != _snapshot->styles.end() && widthIt->second.isValid()) {
        styleJson["width"] = widthIt->second.isString() ? widthIt->second.asString() : widthIt->second.dump();
    }
    auto heightIt = _snapshot->styles.find("height");
    if (heightIt != _snapshot->styles.end() && heightIt->second.isValid()) {
        styleJson["height"] = heightIt->second.isString() ? heightIt->second.asString() : heightIt->second.dump();
    }
    if (!styleJson.empty()) {
        _snapshot->layout.styleInfo = styleJson.dump();
    }
}
#endif

const std::vector<std::shared_ptr<VirtualDOMNode> >& VirtualDOMNode::getChildren() const {
    return _children;
}

std::shared_ptr<VirtualDOMNode> VirtualDOMNode::findChild(const std::string& id) const {
    for (const auto& child : _children) {
        if (child && child->getId() == id) {
            return child;
        }
    }
    return nullptr;
}

void VirtualDOMNode::notifyComponentUpdate(const ComponentSnapshot& newSnapshot) {
    if (!_observer || !_snapshotWithLayout) {
        return;
    }
    
#if defined(__OHOS__)
    std::string diff;
    if (VirtualDOMNode::checkSnapshotChanged(*_snapshotWithLayout, newSnapshot, true, &diff)) {
        _observer->onNodeUpdate(_id, diff);
    }
#elif defined(TEST_COMPONENT_UPDATE)
    std::string diff;
    if (VirtualDOMNode::checkSnapshotChanged(*_snapshotWithLayout, newSnapshot, false, &diff)) {
        _observer->onNodeUpdate(_id, diff);
    }
#else
    if (VirtualDOMNode::checkSnapshotChanged(*_snapshotWithLayout, newSnapshot, false)) {
        _observer->onNodeUpdate(_id, newSnapshot.stringify());
    }
#endif
}

void VirtualDOMNode::notifyComponentAdded() {
    if (!_observer || !_snapshotWithLayout) {
        return;
    }
    _observer->onNodeAdded(_parentId, _snapshotWithLayout->stringify());
}

void VirtualDOMNode::notifyComponentRemoved() {
    if (!_observer || !_snapshotWithLayout) {
        return;
    }
    _observer->onNodeRemoved(_parentId, _id);
}

bool VirtualDOMNode::checkSnapshotChanged(const ComponentSnapshot& desc1, const ComponentSnapshot& desc2, bool compareLayout, std::string* diff) {
    using json = nlohmann::json;
    bool changed = desc1.id != desc2.id
        || desc1.component != desc2.component
        || desc1.attributes != desc2.attributes
        || desc1.children != desc2.children
        || desc1.styles != desc2.styles
        || (compareLayout && desc1.layout != desc2.layout);
    
    if (diff != nullptr && changed) {
        json json1 = json::parse(desc1.stringify());
        json json2 = json::parse(desc2.stringify());

        // Build diff JSON; always include id and component
        json diffJson;
        diffJson["id"] = json2["id"];
        diffJson["component"] = json2["component"];

        // Include only changed fields
        for (auto it = json2.begin(); it != json2.end(); ++it) {
            const std::string& key = it.key();
            if (key == "id" || key == "rawId") continue;
            if (json1.find(key) == json1.end() || json1[key] != it.value()) {
                diffJson[key] = it.value();
            }
        }

        // Fields present in json1 but absent in json2 are set to null (deleted)
        for (auto it = json1.begin(); it != json1.end(); ++it) {
            const std::string& key = it.key();
            if (key == "id" || key == "rawId") continue;
            if (json2.find(key) == json2.end()) {
                diffJson[key] = nullptr;
            }
        }

        *diff = diffJson.dump();
    }
    
    return changed;
}

void VirtualDOMNode::updateChildren() {
    if (!_snapshot) {
        return;
    }
    const auto& targetChildrenIds = _snapshot->children;
    std::map<std::string, ComponentSnapshot> removedSnapshots;  // Temporarily hold snapshots of removed nodes
    size_t i = 0;
    auto targetChildrenIdsSize = targetChildrenIds.size();
    for (; i < targetChildrenIdsSize; i++) {
        const std::string& targetId = targetChildrenIds[i];
        
        while (i < _children.size() && targetId != _children[i]->getId()) {
            // Position mismatch: stash the node's snapshot and remove it
            auto& currentChild = _children[i];
#if defined(__OHOS__)
            if (currentChild && currentChild->_yogaNode != nullptr) {
                YGNodeRemoveChild(_yogaNode, currentChild->_yogaNode);
            }
#endif
            if (currentChild && currentChild->hasSnapshot()) {
                removedSnapshots[currentChild->getId()] = *(currentChild->_snapshot);
            }
            _children.erase(_children.begin() + i);
        }

        if (i >= _children.size()) {
            // Not found: insert a new node at the end
            auto newChild = std::make_shared<VirtualDOMNode>(targetId, _observer, _orphanFetcher);
            newChild->_parent = this;
            _children.emplace_back(newChild);

#if defined(__OHOS__)
            YGNodeInsertChild(_yogaNode, newChild->_yogaNode, static_cast<uint32_t>(i));
#endif
        }

        if (i < _children.size() && _children[i]) {
            auto child = _children[i];
            if (!child->hasSnapshot()) {
                // Restore the snapshot from the stash if available
                auto it = removedSnapshots.find(targetId);
                if (it != removedSnapshots.end()) {
                    child->setSnapshot(it->second, _id);
                    removedSnapshots.erase(it);
                } else if (_orphanFetcher != nullptr) {
                    // Otherwise, try to fetch an orphan snapshot
                    ComponentSnapshot orphanSnapshot;
                    if (_orphanFetcher->takeOrphanSnapshot(targetId, orphanSnapshot)) {
                        child->setSnapshot(orphanSnapshot, _id);
                    }
                }

#if defined(__OHOS__)
                if (YGNodeHasMeasureFunc(child->_yogaNode)) {
                    YGNodeMarkDirty(child->_yogaNode);
                }
#endif
            }
        }
    }
    
    // Remove remaining nodes not present in the target list
    while (i < _children.size()) {
#if defined(__OHOS__)
        if (_children[i] && _children[i]->_yogaNode != nullptr) {
            YGNodeRemoveChild(_yogaNode, _children[i]->_yogaNode);
        }
#endif
        _children.erase(_children.begin() + i);
    }
}

void VirtualDOMNode::refreshChildrenRecursively() {
    updateChildren();
    for (const auto& child : _children) {
        if (child) {
            child->refreshChildrenRecursively();
        }
    }
}


void VirtualDOMNode::checkAndNotifyLayoutChanges() {
    if (!_snapshot) {
        return;
    }

#if defined(__OHOS__)
    // Fast path: if the current node has no new layout and has already been notified, skip the detailed check
    // Still recurse into children since they may have HasNewLayout=true
    if (_yogaNode && !YGNodeGetHasNewLayout(_yogaNode) && _snapshotWithLayout) {
        for (const auto& child : _children) {
            if (child) {
                child->checkAndNotifyLayoutChanges();
            }
        }
        return;
    }
#endif

    // Create a copy of the raw snapshot to fill in layout info,
    // so _snapshot always remains the original unmodified data
    ComponentSnapshot snapshotWithLayout = *_snapshot;

#if defined(__OHOS__)
    if (!_yogaNode) {
        return;
    }
    
    if (YGNodeGetHasNewLayout(_yogaNode)) {
        // If this node is a Text child of a Tabs parent, rebuild the Tabs Yoga tree
        // to update the label layout using the current Text node's height
        if (_parent && _parent->_tabsPicker && _parent->_tabsPicker->isContainChild(_id) && _yogaNode) {
            _parent->_tabsPicker->creatCellYogaNode(AGenUIVirtualDefine::getDeviceScreenSize().width, YGNodeLayoutGetHeight(_yogaNode));
            LayoutInfo labelLayout = _parent->_tabsPicker->getLabelAbsolute();
            CSSStyleConverter::applyPosition(_yogaNode, SerializableData(SerializableData::Impl::create("absolute")));
            CSSStyleConverter::applyLeft(_yogaNode, SerializableData(SerializableData::Impl::create(labelLayout.x)));
            CSSStyleConverter::applyTop(_yogaNode, SerializableData(SerializableData::Impl::create(labelLayout.y + labelLayout.height)));
        }
        
        snapshotWithLayout.layout.x = YGNodeLayoutGetLeft(_yogaNode);
        snapshotWithLayout.layout.y = YGNodeLayoutGetTop(_yogaNode);
        snapshotWithLayout.layout.width = YGNodeLayoutGetWidth(_yogaNode);
        snapshotWithLayout.layout.height = YGNodeLayoutGetHeight(_yogaNode);
        // Propagate styleInfo saved earlier in setSnapshot
        if (!_snapshot->layout.styleInfo.empty()) {
            snapshotWithLayout.layout.styleInfo = _snapshot->layout.styleInfo;
        }
        //logYogaLayoutInfo(snapshotWithLayout);

        YGNodeSetHasNewLayout(_yogaNode, false);
    } else {
        if (_snapshotWithLayout) {
            snapshotWithLayout = *_snapshotWithLayout;
        }
    }
#endif

    // Fill in missing style default values
    const auto& styleDefaults = StyleDefaults::getDefaults();
    for (const auto& pair : styleDefaults) {
        if (snapshotWithLayout.styles.find(pair.first) == snapshotWithLayout.styles.end()) {
            snapshotWithLayout.styles[pair.first] = SerializableData(SerializableData::Impl::parse(pair.second));
        }
    }

    if (!_snapshotWithLayout) {
        // First notification: create the layout-filled snapshot and notify addition
        _snapshotWithLayout = std::make_shared<ComponentSnapshot>(snapshotWithLayout);
        notifyComponentAdded();
    } else {
        notifyComponentUpdate(snapshotWithLayout);
        *_snapshotWithLayout = snapshotWithLayout;
    }

#if defined(__OHOS__)
    // Recursively check all children for layout changes
    // (Yoga layout may propagate changes to descendants)
    for (const auto& child : _children) {
        if (child) {
            child->checkAndNotifyLayoutChanges();
        }
    }
#endif
}

#if defined(__OHOS__)
void VirtualDOMNode::setupMeasureFunctionIfNeeded() {
    if (_snapshot == nullptr) {
        return;
    }
    
    bool needsMeasure = false;
    
    const std::string& componentType = _snapshot->component;

    // Text-based components need a measure function
    if (componentType == "Text" ||
        componentType == "RichText" ||
        componentType == "Markdown") {
        needsMeasure = true;
    }

    // Media and other intrinsic-size components need a measure function
    if (componentType == "Image" ||
        componentType == "Icon" ||
        componentType == "Video" ||
        componentType == "AudioPlayer" ||
        componentType == "Slider" ||
        componentType == "Lottie" ||
        componentType == "Divider" ||
        componentType == "DateTimeInput" ||
        componentType == "Web" ||
        componentType == "Chart") {
        needsMeasure = true;
    }

    if (componentType == "Button") {
        setupButtonLayout();
    }

    if (componentType == "Divider") {
        setupDividerLayout();
    }

    if (componentType == "Table") {
        setupTableLayout();
    }

    if (componentType == "ChoicePicker") {
        setupChoicePickerLayout();
    }

    if (componentType == "Tabs") {
        setupTabsLayout();
    }

    if (componentType == "AudioPlayer") {
        setupAudioPlayerLayout();
    }

    if (componentType == "CheckBox") {
        setupCheckBoxLayout();
    }

    if (needsMeasure) {
        YGNodeSetContext(_yogaNode, this);
        YGNodeSetMeasureFunc(_yogaNode, measureFunction);
        // Must mark dirty after setting the measure function so Yoga re-measures
        if (YGNodeHasMeasureFunc(_yogaNode)) {
            YGNodeMarkDirty(_yogaNode);
        }
    }
    
}

void VirtualDOMNode::setupButtonLayout() {
    YGNodeStyleSetFlexDirection(_yogaNode, YGFlexDirectionColumn);
}

void VirtualDOMNode::setupDividerLayout() {
    // thickness comes from attributes; axis comes from styles
    float thicknessPx = 1.0f;
    auto thicknessIt = _snapshot->attributes.find(CSSPropertyNames::kThickness);
    if (thicknessIt != _snapshot->attributes.end()) {
        if (thicknessIt->second.isNumber()) {
            thicknessPx = static_cast<float>(thicknessIt->second.asDouble());
        } else {
            std::string v = thicknessIt->second.asString();
            if (!v.empty()) {
                thicknessPx = std::stof(v);
            }
        }
    }

    std::string axis = "vertical";  // default
    auto axisIt = _snapshot->styles.find(A2UIPropertyNames::kAxis);
    if (axisIt != _snapshot->styles.end()) {
        axis = axisIt->second.isString() ? axisIt->second.asString() : axisIt->second.dump();
    }

    if (axis == "vertical") {
        // Vertical divider: thickness becomes the width; height is determined by Yoga
        YGNodeStyleSetWidth(_yogaNode, thicknessPx);
        YGNodeStyleSetHeight(_yogaNode, YGUndefined);
    } else {
        // Horizontal divider: thickness becomes the height; width is determined by Yoga
        YGNodeStyleSetWidth(_yogaNode, YGUndefined);
        YGNodeStyleSetHeight(_yogaNode, thicknessPx);
    }
}

void VirtualDOMNode::setupTableLayout() {
    // Create _table only once (may be called again on snapshot updates)
    if (!_table) {
        auto measureTextFunc = [this](const ComponentSnapshot& snap, float mw, int& lines) -> YGSize {
            const YGMeasureMode mode = mw > 0.0f ? YGMeasureModeAtMost : YGMeasureModeUndefined;
            return this->measureTextComponent(snap, mw, mode, lines);
        };
        _table = std::make_shared<IVirtualDomTable>(*_snapshot, measureTextFunc, this);
    }
    if (_table && _table->getYogaNode()) {
        _table->creatCellYogaNode(AGenUIVirtualDefine::getDeviceScreenSize().width);
        // Insert only when not yet mounted to avoid corrupting Yoga internal state
        if (YGNodeGetOwner(_table->getYogaNode()) == nullptr) {
            YGNodeInsertChild(_yogaNode, _table->getYogaNode(), 0);
        }
        if (YGNodeHasMeasureFunc(_table->getYogaNode())) {
            YGNodeMarkDirty(_table->getYogaNode());
        }
    }
}

void VirtualDOMNode::setupChoicePickerLayout() {
    // Create _choicePicker only once (may be called again on snapshot updates)
    if (!_choicePicker) {
        auto measureTextFunc = [this](const ComponentSnapshot& snap, float mw, int& lines) -> YGSize {
            const YGMeasureMode mode = mw > 0.0f ? YGMeasureModeAtMost : YGMeasureModeUndefined;
            return this->measureTextComponent(snap, mw, mode, lines);
        };
        _choicePicker = std::make_shared<IvirtualDomChoicePicker>(*_snapshot, measureTextFunc, this);
        YGSize screenSize = AGenUIVirtualDefine::getDeviceScreenSize();
        _choicePicker->creatCellYogaNode(screenSize.width);
    }
    if (_choicePicker && _choicePicker->getYogaNode()) {
        // Insert only when not yet mounted to avoid corrupting Yoga internal state
        if (YGNodeGetOwner(_choicePicker->getYogaNode()) == nullptr) {
            YGNodeInsertChild(_yogaNode, _choicePicker->getYogaNode(), 0);
        }
        if (YGNodeHasMeasureFunc(_choicePicker->getYogaNode())) {
            YGNodeMarkDirty(_choicePicker->getYogaNode());
        }
    }
}

void VirtualDOMNode::setupTabsLayout() {
    YGNodeStyleSetFlexDirection(_yogaNode, YGFlexDirectionColumn);
    // Create _tabsPicker only once (may be called again on snapshot updates)
    if (!_tabsPicker) {
        auto measureTextFunc = [this](const ComponentSnapshot& snap, float mw, int& lines) -> YGSize {
            const YGMeasureMode mode = mw > 0.0f ? YGMeasureModeAtMost : YGMeasureModeUndefined;
            return this->measureTextComponent(snap, mw, mode, lines);
        };
        _tabsPicker = std::make_shared<IvirtualDomTabs>(*_snapshot, measureTextFunc, this);
    }
    if (_tabsPicker && _tabsPicker->getYogaNode()) {
        _tabsPicker->creatCellYogaNode(AGenUIVirtualDefine::getDeviceScreenSize().width, YGNodeLayoutGetHeight(_yogaNode));
        // Insert only when not yet mounted to avoid corrupting Yoga internal state
        if (YGNodeGetOwner(_tabsPicker->getYogaNode()) == nullptr) {
            YGNodeInsertChild(_yogaNode, _tabsPicker->getYogaNode(), 0);
        }
        if (YGNodeHasMeasureFunc(_tabsPicker->getYogaNode())) {
            YGNodeMarkDirty(_tabsPicker->getYogaNode());
        }
    }
}

void VirtualDOMNode::setupAudioPlayerLayout() {
    float defaultHeight = 300;
    YGNodeStyleSetHeight(_yogaNode, defaultHeight);
}

void VirtualDOMNode::setupCheckBoxLayout() {
    const nlohmann::json& componentStyles = CSSStyleConverter::getDeviceComponentStylesJson();

    auto getStringValue = [&](const std::string& section, const std::string& key) -> std::string {
        if (!componentStyles.contains(section) || !componentStyles[section].is_object()) return "";
        const nlohmann::json& sectionStyles = componentStyles[section];
        if (!sectionStyles.contains(key)) return "";
        const auto& value = sectionStyles[key];
        if (value.is_string()) return value.get<std::string>();
        if (value.is_number()) return std::to_string(value.get<double>());
        return "";
    };

    // Row layout, aligned with ARKUI_NODE_ROW on HarmonyOS
    YGNodeStyleSetFlexDirection(_yogaNode, YGFlexDirectionRow);
    YGNodeStyleSetAlignItems(_yogaNode, YGAlignCenter);

    // Create checkbox node (fixed size)
    YGNodeRef checkboxNode = YGNodeNew();
    std::string checkboxSize = getStringValue("CheckBox", "checkbox-size");
    if (!checkboxSize.empty()) {
        SerializableData styleValue(SerializableData::Impl::create(checkboxSize));
        CSSStyleConverter::applyWidth(checkboxNode, styleValue, false);
        CSSStyleConverter::applyHeight(checkboxNode, styleValue, false);
    }
    std::string borderWidth = getStringValue("CheckBox", "checkbox-border-width");
    if (!borderWidth.empty()) {
        CSSStyleConverter::applyBorderWidth(checkboxNode, SerializableData(SerializableData::Impl::create(borderWidth)));
    }
    // Checkbox margin (matches HarmonyOS setMargin(8,8,8,8))
    YGNodeStyleSetMargin(checkboxNode, YGEdgeAll, 8.0f);
    YGNodeInsertChild(_yogaNode, checkboxNode, 0);

    // Create text node (with measure function)
    YGNodeRef textNode = YGNodeNew();

    // text-size -> font-size
    std::string textSize = getStringValue("CheckBox", "text-size");
    if (!textSize.empty() && _snapshot) {
        _snapshot->styles["font-size"] = SerializableData(SerializableData::Impl::create(textSize));
    }
    // text-margin -> left margin (matches HarmonyOS setMargin(0, 0, 0, textMargin))
    std::string textMargin = getStringValue("CheckBox", "text-margin");
    if (!textMargin.empty()) {
        float marginValue = CSSStyleConverter::parseStyleDimension(
            componentStyles.contains("CheckBox") ? componentStyles["CheckBox"] : nlohmann::json::object(),
            "text-margin", 0.0f);
        YGNodeStyleSetMargin(textNode, YGEdgeLeft, marginValue);
    }

    // Fill remaining space (matches HarmonyOS layoutWeight(1))
    YGNodeStyleSetFlexShrink(textNode, 1.0f);
    YGNodeStyleSetFlexGrow(textNode, 1.0f);

    YGNodeSetContext(textNode, this);
    YGNodeSetMeasureFunc(textNode, checkBoxTextMeasureFunc);
    if (YGNodeHasMeasureFunc(textNode)) {
        YGNodeMarkDirty(textNode);
    }
    YGNodeInsertChild(_yogaNode, textNode, 1);
}

YGSize VirtualDOMNode::checkBoxTextMeasureFunc(
    YGNodeRef node, float width, YGMeasureMode widthMode,
    float height, YGMeasureMode heightMode) {
    (void)height;
    (void)heightMode;
    auto* self = static_cast<VirtualDOMNode*>(YGNodeGetContext(node));
    if (!self || !self->_snapshot) return {0.0f, 0.0f};
    int dummyLines = 0;
    return self->measureTextComponent(*self->_snapshot, width, widthMode, dummyLines);
}

YGSize VirtualDOMNode::measureFunction(
    YGNodeRef node,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode) {
    
    VirtualDOMNode* self = static_cast<VirtualDOMNode*>(YGNodeGetContext(node));

    if (!self || !self->_snapshot) {
        return {0, 0};
    }
    
    ComponentSnapshot& snapshot = *self->_snapshot;
    
    if (snapshot.component == "DateTimeInput") {
        return self->measureDateTimeInputComponent(snapshot, width, widthMode, height, heightMode);
    }
    
    // 1. If a text or label attribute exists, use text measurement
    if (snapshot.attributes.find("text") != snapshot.attributes.end() || snapshot.attributes.find("label") != snapshot.attributes.end()) {
        return self->measureTextComponent(snapshot, width, widthMode, snapshot.layout.lines);
    }
    
    if (snapshot.component == "Lottie") {
        return self->measureLottieComponent(snapshot, width, widthMode, height, heightMode);
    }

    if (snapshot.component == "Chart") {
        return self->measureChartComponent(snapshot, width, widthMode, height, heightMode);
    }

    if (snapshot.component == "Slider") {
        return self->measureSliderComponent(snapshot, width, widthMode, height, heightMode);
    }

    // 2. If a url attribute exists, use image measurement
    if (snapshot.attributes.find("url") != snapshot.attributes.end()) {
        return self->measureImageComponent(snapshot, width, widthMode, height, heightMode);
    }

    // 3. Custom intrinsic size attributes
    auto widthIt = snapshot.attributes.find("intrinsicWidth");
    auto heightIt = snapshot.attributes.find("intrinsicHeight");
    if (widthIt != snapshot.attributes.end() && heightIt != snapshot.attributes.end()) {
        return {
            std::stof(widthIt->second.dump()),
            std::stof(heightIt->second.dump())
        };
    }
    
    return {0, 0};
}

YGSize VirtualDOMNode::measureTextComponent(const ComponentSnapshot& snapshot, float width, YGMeasureMode widthMode, int& lines) const {
    const std::string& comp = snapshot.component;
    
    float paddingWidth = 0;
    if (comp != "Text" && 
        comp != "RichText" && 
        comp != "CheckBox" && 
        comp != "ChoicePicker" &&
        comp != "Tabs") {
        return {0, 0};
    }

    auto textIt = snapshot.attributes.find("text");
    auto labelIt = snapshot.attributes.find("label");
    std::string text = "";
    if (textIt != snapshot.attributes.end() ) {
        text = parseSnapshotValue(textIt->second);
    } else if (labelIt != snapshot.attributes.end() ) {
        text = parseSnapshotValue(labelIt->second);
    } else {
        return {0, 0};
    }
    
    if(text.empty()) {
        return {0, 0};
    }

    // Initialize TextMeasureParam with defaults
    IPlatformLayoutBridge::TextMeasureParam measureParam;
    measureParam.text             = text.c_str();
    measureParam.fontSize         = 24;
    measureParam.letter_spacing   = 0;
    measureParam.fontStyle        = NODE_PROPERTY_FONT_NORMAL;
    measureParam.textAlign        = TEXT_ALIGN_LEFT_TOP;
    measureParam.fontWeight       = NODE_PROPERTY_FONT_NORMAL;
    measureParam.isMultLineHeight = true;
    measureParam.lineHeight       = 1.0f;
    measureParam.maxLines         = INT_MAX;
    measureParam.id               = 0;
    measureParam.textOverflow     = NODE_PROPERTY_TEXT_OVERFLOW_UNDEFINED;
    measureParam.isRichtext       = CSSStyleConverter::isRichText(measureParam.text);
    measureParam.fontFamily       = "";
    measureParam.extras           = "";

    // Helper: prefer attributes; fall back to styles
    auto getValue = [&](const std::string& key) -> SerializableData {
        auto it = snapshot.attributes.find(key);
        if (it != snapshot.attributes.end()) {
            return it->second;
        }
        auto sit = snapshot.styles.find(key);
        if (sit != snapshot.styles.end()) {
            return sit->second;
        }
        return SerializableData();
    };

    bool hasAnyStyle = !snapshot.styles.empty();

    // font-size (camelCase alias)
    {
        SerializableData val = getValue("fontSize");
        if (val.isNumber()) {
            measureParam.fontSize = val.asInt();
        } else {
            std::string valStr = val.asString();
            if (!valStr.empty()) {
                measureParam.fontSize = atoi(valStr.c_str());
            } else if (!hasAnyStyle) {
                std::string def = AGenUIVirtualDefine::getDefaultValue("font-size");
                if (!def.empty()) measureParam.fontSize = atoi(def.c_str());
            }
        }
    }
    
    {
        SerializableData val = getValue("font-size");
        if (val.isNumber()) {
            measureParam.fontSize = val.asInt();
        } else {
            std::string valStr = val.asString();
            if (!valStr.empty()) {
                measureParam.fontSize = atoi(valStr.c_str());
            } else if (!hasAnyStyle) {
                std::string def = AGenUIVirtualDefine::getDefaultValue("font-size");
                if (!def.empty()) measureParam.fontSize = atoi(def.c_str());
            }
        }
    }
    {
        SerializableData val = getValue("fontSize");
        if (val.isNumber()) {
            measureParam.fontSize = val.asInt();
        } else {
            std::string valStr = val.asString();
            if (!valStr.empty()) {
                measureParam.fontSize = atoi(valStr.c_str());
            } else if (!hasAnyStyle) {
                std::string def = AGenUIVirtualDefine::getDefaultValue("font-size");
                if (!def.empty()) measureParam.fontSize = atoi(def.c_str());
            }
        }
    }

    // font-weight -> int
    {
        SerializableData val = getValue("font-weight");
        if (val.isNumber()) {
            measureParam.fontWeight = val.asInt();
        } else {
            std::string valStr = val.asString();
            if (!valStr.empty()) {
                if      (valStr == "bold")   measureParam.fontWeight = NODE_PROPERTY_FONT_BOLD;
                else if (valStr == "bolder") measureParam.fontWeight = NODE_PROPERTY_FONT_BOLDER;
                else if (valStr == "normal") measureParam.fontWeight = NODE_PROPERTY_FONT_NORMAL;
                else                          measureParam.fontWeight = atoi(valStr.c_str());
            } else if (!hasAnyStyle) {
                measureParam.fontWeight = AGenUIVirtualDefine::getDefaultKey("font-weight");
            }
        }
    }
    
    // font-weight (camelCase alias)
    {
        SerializableData val = getValue("fontWeight");
        if (val.isNumber()) {
            measureParam.fontWeight = val.asInt();
        } else {
            std::string valStr = val.asString();
            if (!valStr.empty()) {
                if      (valStr == "bold")   measureParam.fontWeight = NODE_PROPERTY_FONT_BOLD;
                else if (valStr == "bolder") measureParam.fontWeight = NODE_PROPERTY_FONT_BOLDER;
                else if (valStr == "normal") measureParam.fontWeight = NODE_PROPERTY_FONT_NORMAL;
                else                          measureParam.fontWeight = atoi(valStr.c_str());
            } else if (!hasAnyStyle) {
                measureParam.fontWeight = AGenUIVirtualDefine::getDefaultKey("font-weight");
            }
        }
    }

    // font-style -> int
    {
        SerializableData val = getValue("font-style");
        if (val.isNumber()) {
            measureParam.fontStyle = val.asInt();
        } else {
            std::string valStr = val.asString();
            if (!valStr.empty()) {
                if      (valStr == "italic") measureParam.fontStyle = NODE_PROPERTY_FONT_ITALIC;
                else if (valStr == "normal") measureParam.fontStyle = NODE_PROPERTY_FONT_NORMAL;
                else                          measureParam.fontStyle = atoi(valStr.c_str());
            } else if (!hasAnyStyle) {
                measureParam.fontStyle = AGenUIVirtualDefine::getDefaultKey("font-style");
            }
        }
    }

    // font-family -> const char*
    SerializableData fontFamilyData = getValue("font-family");
    std::string fontFamilyStr = fontFamilyData.asString();
    if (!fontFamilyStr.empty()) {
        measureParam.fontFamily = fontFamilyStr.c_str();
    } else if (!hasAnyStyle) {
        fontFamilyStr = AGenUIVirtualDefine::getDefaultValue("font-family");
        if (!fontFamilyStr.empty()) measureParam.fontFamily = fontFamilyStr.c_str();
    }

    // text-align -> int
    {
        SerializableData val = getValue("text-align");
        std::string valStr = val.asString();
        if (!valStr.empty()) {
            if (valStr == "left top") {
                measureParam.textAlign = TEXT_ALIGN_LEFT_TOP;
            } else if (valStr == "left" || valStr == "left center") {
                measureParam.textAlign = TEXT_ALIGN_LEFT_V_CENTER;
            } else if (valStr == "left bottom") {
                measureParam.textAlign = TEXT_ALIGN_LEFT_BOTTOM;
            } else if (valStr == "center top") {
                measureParam.textAlign = TEXT_ALIGN_TOP_H_CENTER;
            } else if (valStr == "center" || valStr == "center center") {
                measureParam.textAlign = TEXT_ALIGN_CENTER;
            } else if (valStr == "center bottom") {
                measureParam.textAlign = TEXT_ALIGN_BOTTOM_H_CENTER;
            } else if (valStr == "right top") {
                measureParam.textAlign = TEXT_ALIGN_RIGHT_TOP;
            } else if (valStr == "right" || valStr == "right center") {
                measureParam.textAlign = TEXT_ALIGN_RIGHT_V_CENTER;
            } else if (valStr == "right bottom") {
                measureParam.textAlign = TEXT_ALIGN_RIGHT_BOTTOM;
            } else {
                // Unknown value: fall back to default
                measureParam.textAlign = AGenUIVirtualDefine::getDefaultKey("text-align");
            }
        } else if (!hasAnyStyle) {
            measureParam.textAlign = AGenUIVirtualDefine::getDefaultKey("text-align");
        }
    }

    // letter-spacing -> float
    {
        SerializableData val = getValue("letter-spacing");
        if (val.isNumber()) {
            measureParam.letter_spacing = static_cast<float>(val.asDouble());
        } else {
            std::string valStr = val.asString();
            if (!valStr.empty()) {
                measureParam.letter_spacing = static_cast<float>(atof(valStr.c_str()));
            } else if (!hasAnyStyle) {
                std::string def = AGenUIVirtualDefine::getDefaultValue("letter-spacing");
                if (!def.empty()) measureParam.letter_spacing = static_cast<float>(atof(def.c_str()));
            }
        }
    }

    // line-height -> float
    {
        SerializableData val = getValue("line-height");
        float lineHeight = 0;
        bool hasValue = false;
        if (val.isNumber()) {
            lineHeight = static_cast<float>(val.asDouble());
            hasValue = true;
        } else {
            std::string valStr = val.asString();
            if (!valStr.empty()) {
                lineHeight = static_cast<float>(atof(valStr.c_str()));
                hasValue = true;
            }
        }
        if (hasValue) {
            // Line height interpretation:
            //   <= 5.0  -> multiplier  (e.g. 1.0, 1.2, 1.5): actualLineHeight = fontSize * lineHeight
            //   >= 10.0 -> absolute px (e.g. 16, 24, 40):    actualLineHeight = lineHeight
            if (lineHeight < 5.0f) {
                measureParam.lineHeight = lineHeight;
            } else {
                measureParam.lineHeight = lineHeight / measureParam.fontSize;
            }
        } else if (!hasAnyStyle) {
            std::string def = AGenUIVirtualDefine::getDefaultValue("line-height");
            if (!def.empty()) measureParam.lineHeight = static_cast<float>(atof(def.c_str()));
        }
    }

    // line-clamp -> int (maxLines)
    {
        SerializableData val = getValue("line-clamp");
        if (val.isNumber()) {
            int clampVal = val.asInt();
            measureParam.maxLines = clampVal <= 0 ? INT_MAX : clampVal;
        } else {
            std::string valStr = val.asString();
            if (!valStr.empty()) {
                int clampVal = atoi(valStr.c_str());
                measureParam.maxLines = clampVal <= 0 ? INT_MAX : clampVal;
            } else if (!hasAnyStyle) {
                int32_t k = AGenUIVirtualDefine::getDefaultKey("line-clamp");
                if (k != 0) measureParam.maxLines = k;
            }
        }
    }

    // text-overflow -> int
    {
        SerializableData val = getValue("text-overflow");
        if (val.isNumber()) {
            measureParam.textOverflow = val.asInt();
        } else {
            std::string valStr = val.asString();
            if (!valStr.empty()) {
                if      (valStr == "ellipsis") measureParam.textOverflow = NODE_PROPERTY_TEXT_OVERFLOW_ELLIPSIS;
                else if (valStr == "clip")     measureParam.textOverflow = NODE_PROPERTY_TEXT_OVERFLOW_CLIP;
                else                            measureParam.textOverflow = atoi(valStr.c_str());
            } else if (!hasAnyStyle) {
                measureParam.textOverflow = AGenUIVirtualDefine::getDefaultKey("text-overflow");
            }
        }
    }

    // white-space -> isMultLineHeight
    {
        SerializableData val = getValue("white-space");
        std::string valStr = val.asString();
        if (!valStr.empty()) {
            measureParam.isMultLineHeight = (valStr != "nowrap" && valStr != "pre");
        } else if (!hasAnyStyle) {
            std::string def = AGenUIVirtualDefine::getDefaultValue("white-space");
            if (!def.empty()) measureParam.isMultLineHeight = (def != "nowrap" && def != "pre");
        }
    }

    IPlatformLayoutBridge* platformLayoutBridge = AGenUIVirtualDefine::getPlatformLayoutBridge();
    if (platformLayoutBridge != nullptr) {
        auto textMeasurement = platformLayoutBridge->getTextMeasurement();
        if (textMeasurement != nullptr) {
            IPlatformLayoutBridge::MeasureMode deviceWidthMode = IPlatformLayoutBridge::MeasureModeUndefined;
            switch (widthMode) {
                case YGMeasureModeExactly:
                    deviceWidthMode = IPlatformLayoutBridge::MeasureModeExactly;
                    break;
                case YGMeasureModeAtMost:
                    deviceWidthMode = IPlatformLayoutBridge::MeasureModeAtMost;
                    break;
                case YGMeasureModeUndefined:
                default:
                    deviceWidthMode = IPlatformLayoutBridge::MeasureModeUndefined;
                    break;
            }
            IPlatformLayoutBridge::MeasureSize result = textMeasurement->measure(
                measureParam, width, deviceWidthMode, 0, IPlatformLayoutBridge::MeasureModeUndefined);
            lines = result.lines;
            return {result.width, result.height};
        }
    }
    lines = 0;
    return {0, 0};
}

YGSize VirtualDOMNode::measureImageComponent(const ComponentSnapshot& snapshot, float maxWidth, YGMeasureMode widthMode, float maxHeight, YGMeasureMode heightMode) const {
    float width = 0.0f;
    float height = 0.0f;
    std::string url = "";

    auto widthIt = snapshot.styles.find("width");
    if (widthIt != snapshot.styles.end()) {
        if (widthIt->second.isNumber()) {
            width = static_cast<float>(widthIt->second.asDouble());
        } else {
            std::string actualValue = widthIt->second.asString();
            size_t unitPos = actualValue.find_first_not_of("0123456789.-");
            if (unitPos != std::string::npos) {
                actualValue = actualValue.substr(0, unitPos);
            }
            if (!actualValue.empty()) width = std::stof(actualValue);
        }
    }

    auto heightIt = snapshot.styles.find("height");
    if (heightIt != snapshot.styles.end()) {
        if (heightIt->second.isNumber()) {
            height = static_cast<float>(heightIt->second.asDouble());
        } else {
            std::string actualValue = heightIt->second.asString();
            size_t unitPos = actualValue.find_first_not_of("0123456789.-");
            if (unitPos != std::string::npos) {
                actualValue = actualValue.substr(0, unitPos);
            }
            if (!actualValue.empty()) height = std::stof(actualValue);
        }
    }

    auto urlIt = snapshot.attributes.find("url");
    if (urlIt != snapshot.attributes.end()) {
        url = urlIt->second.dump();
    }
    
    IPlatformLayoutBridge::ImgMeasureParam measureParam;
    measureParam.src = url.c_str();
    IPlatformLayoutBridge* platformLayoutBridge = AGenUIVirtualDefine::getPlatformLayoutBridge();
    if (platformLayoutBridge != nullptr) {
        auto imageMeasurement = platformLayoutBridge->getImgMeasurement();
        if (imageMeasurement != nullptr) {
            IPlatformLayoutBridge::MeasureSize result = imageMeasurement->measure(
                measureParam, width, (IPlatformLayoutBridge::MeasureMode)widthMode, 
                height, (IPlatformLayoutBridge::MeasureMode)heightMode);
            return {result.width, result.height};
        }
    }
    return {width, height};
}

YGSize VirtualDOMNode::measureLottieComponent(const ComponentSnapshot& snapshot, float maxWidth, YGMeasureMode widthMode, float maxHeight, YGMeasureMode heightMode) const {
    std::string url = "";

    auto urlIt = snapshot.attributes.find("url");
    if (urlIt != snapshot.attributes.end()) {
        url = urlIt->second.dump();
    }
    
    IPlatformLayoutBridge::LottieMeasureParam measureParam;
    measureParam.url = url.c_str();
    measureParam.id = 0;

    IPlatformLayoutBridge* platformLayoutBridge = AGenUIVirtualDefine::getPlatformLayoutBridge();
    if (platformLayoutBridge != nullptr) {
        auto lottieMeasurement = platformLayoutBridge->getLottieMeasurement();
        if (lottieMeasurement != nullptr) {
            IPlatformLayoutBridge::MeasureSize result = lottieMeasurement->measure(
                measureParam, maxWidth, (IPlatformLayoutBridge::MeasureMode)widthMode, 
                maxHeight, (IPlatformLayoutBridge::MeasureMode)heightMode);
            return {result.width, result.height};
        }
    }
    
    return {100.0f, 100.0f};  // fallback default size
}

YGSize VirtualDOMNode::measureChartComponent(const ComponentSnapshot& snapshot, float maxWidth, YGMeasureMode widthMode, float maxHeight, YGMeasureMode heightMode) const {
    std::string chartType = "";
    std::string chartData = "";
    std::string chartConfig = "";

    auto typeIt = snapshot.attributes.find("chartType");
    if (typeIt != snapshot.attributes.end()) {
        chartType = typeIt->second.asString();
    }

    auto dataIt = snapshot.attributes.find("data");
    if (dataIt != snapshot.attributes.end()) {
        chartData = dataIt->second.dump();
    }

    auto configIt = snapshot.attributes.find("config");
    if (configIt != snapshot.attributes.end()) {
        chartConfig = configIt->second.dump();
    }

    IPlatformLayoutBridge::ChartMeasureParam measureParam;
    measureParam.type = chartType.c_str();
    measureParam.data = chartData.c_str();
    measureParam.config = chartConfig.c_str();
    measureParam.id = 0;

    IPlatformLayoutBridge* platformLayoutBridge = AGenUIVirtualDefine::getPlatformLayoutBridge();
    if (platformLayoutBridge != nullptr) {
        auto chartMeasurement = platformLayoutBridge->getChartMeasurement();
        if (chartMeasurement != nullptr) {
            IPlatformLayoutBridge::MeasureSize result = chartMeasurement->measure(
                measureParam, maxWidth, (IPlatformLayoutBridge::MeasureMode)widthMode,
                maxHeight, (IPlatformLayoutBridge::MeasureMode)heightMode);
            return {result.width, result.height};
        }
    }
    
    // Fallback defaults by chart type
    if (chartType == "donut" || chartType == "pie") {
        return {300.0f, 300.0f};
    } else if (chartType == "line") {
        return {400.0f, 250.0f};
    } else if (chartType == "bar") {
        return {400.0f, 300.0f};
    }
    return {350.0f, 300.0f};
}

YGSize VirtualDOMNode::measureSliderComponent(
    const ComponentSnapshot& snapshot,
    float maxWidth,
    YGMeasureMode widthMode,
    float maxHeight,
    YGMeasureMode heightMode) const
{
    (void)snapshot;

    const nlohmann::json& componentStyles = CSSStyleConverter::getDeviceComponentStylesJson();
    const nlohmann::json sliderStyles = componentStyles.contains("Slider") && componentStyles["Slider"].is_object()
        ? componentStyles["Slider"]
        : nlohmann::json::object();

    const float sliderHeight = CSSStyleConverter::parseStyleDimension(sliderStyles, "slider-height", 48.0f);
    const float thumbOuterDiameter = CSSStyleConverter::parseStyleDimension(sliderStyles, "thumb-outer-diameter", sliderHeight);

    float measuredWidth = 0.0f;
    if ((widthMode == YGMeasureModeExactly || widthMode == YGMeasureModeAtMost) && maxWidth > 0.0f) {
        measuredWidth = maxWidth;
    }

    float measuredHeight = std::max(sliderHeight, thumbOuterDiameter);
    if ((heightMode == YGMeasureModeExactly || heightMode == YGMeasureModeAtMost) && maxHeight > 0.0f) {
        measuredHeight = heightMode == YGMeasureModeAtMost ? std::min(measuredHeight, maxHeight) : maxHeight;
    }

    return {measuredWidth, measuredHeight};
}

YGSize VirtualDOMNode::measureDateTimeInputComponent(
    const ComponentSnapshot& snapshot,
    float maxWidth,
    YGMeasureMode widthMode,
    float maxHeight,
    YGMeasureMode heightMode) const
{
    const nlohmann::json& componentStyles = CSSStyleConverter::getDeviceComponentStylesJson();
    const nlohmann::json dateTimeInputStyles = componentStyles.contains("DateTimeInput") && componentStyles["DateTimeInput"].is_object()
        ? componentStyles["DateTimeInput"]
        : nlohmann::json::object();
    const nlohmann::json compactStyles = dateTimeInputStyles.contains("compact") && dateTimeInputStyles["compact"].is_object()
        ? dateTimeInputStyles["compact"]
        : nlohmann::json::object();

    const float compactHeight = CSSStyleConverter::parseStyleDimension(compactStyles, "height", 56.0f);
    const float fontSize = CSSStyleConverter::parseStyleDimension(compactStyles, "font-size", 24.0f);
    const float iconSize = CSSStyleConverter::parseStyleDimension(compactStyles, "icon-size", 24.0f);
    const float iconSpacing = CSSStyleConverter::parseStyleDimension(compactStyles, "icon-spacing", 6.0f);
    const float paddingVertical = CSSStyleConverter::parseStyleDimension(compactStyles, "padding-vertical", 12.0f);
    const float paddingHorizontal = CSSStyleConverter::parseStyleDimension(compactStyles, "padding-horizontal", 24.0f);

    std::string displayText = "Select date";
    auto placeholderIt = compactStyles.find("placeholder-text");
    if (placeholderIt != compactStyles.end() && placeholderIt->is_string()) {
        displayText = placeholderIt->get<std::string>();
    }

    bool showIcon = true;
    bool hasValue = false;
    auto valueIt = snapshot.attributes.find("value");
    if (valueIt != snapshot.attributes.end()) {
        const std::string value = valueIt->second.asString();
        if (!value.empty()) {
            displayText = value;
            showIcon = false;
            hasValue = true;
        }
    }

    float textWidth = fontSize * 3.0f;
    float textHeight = fontSize;

    IPlatformLayoutBridge* platformLayoutBridge = AGenUIVirtualDefine::getPlatformLayoutBridge();
    if (platformLayoutBridge != nullptr) {
        auto textMeasurement = platformLayoutBridge->getTextMeasurement();
        if (textMeasurement != nullptr) {
            IPlatformLayoutBridge::TextMeasureParam measureParam;
            measureParam.text = displayText.c_str();
            measureParam.fontSize = static_cast<int>(fontSize);
            measureParam.letter_spacing = 0;
            measureParam.fontStyle = NODE_PROPERTY_FONT_NORMAL;
            measureParam.textAlign = TEXT_ALIGN_LEFT_V_CENTER;
            measureParam.fontWeight = hasValue ? NODE_PROPERTY_FONT_BOLD : NODE_PROPERTY_FONT_NORMAL;
            measureParam.isMultLineHeight = false;
            measureParam.lineHeight = 1.0f;
            measureParam.maxLines = 1;
            measureParam.id = 0;
            measureParam.textOverflow = NODE_PROPERTY_TEXT_OVERFLOW_CLIP;
            measureParam.isRichtext = false;
            measureParam.fontFamily = "";
            measureParam.extras = "";

            const float reservedWidth = paddingHorizontal * 2.0f + (showIcon ? (iconSpacing + iconSize) : 0.0f);
            float availableTextWidth = 0.0f;
            IPlatformLayoutBridge::MeasureMode deviceWidthMode = IPlatformLayoutBridge::MeasureModeUndefined;
            switch (widthMode) {
                case YGMeasureModeExactly:
                    deviceWidthMode = IPlatformLayoutBridge::MeasureModeExactly;
                    availableTextWidth = std::max(0.0f, maxWidth - reservedWidth);
                    break;
                case YGMeasureModeAtMost:
                    deviceWidthMode = IPlatformLayoutBridge::MeasureModeAtMost;
                    availableTextWidth = std::max(0.0f, maxWidth - reservedWidth);
                    break;
                case YGMeasureModeUndefined:
                default:
                    deviceWidthMode = IPlatformLayoutBridge::MeasureModeUndefined;
                    availableTextWidth = 0.0f;
                    break;
            }

            const IPlatformLayoutBridge::MeasureSize result = textMeasurement->measure(
                measureParam,
                availableTextWidth,
                deviceWidthMode,
                0.0f,
                IPlatformLayoutBridge::MeasureModeUndefined);
            textWidth = result.width;
            textHeight = result.height;
        }
    }

    float measuredWidth = textWidth + paddingHorizontal * 2.0f;
    if (showIcon) {
        measuredWidth += iconSpacing + iconSize;
    }

    float measuredHeight = std::max(compactHeight, textHeight + paddingVertical * 2.0f);
    if (showIcon) {
        measuredHeight = std::max(measuredHeight, iconSize + paddingVertical * 2.0f);
    }

    if ((widthMode == YGMeasureModeExactly || widthMode == YGMeasureModeAtMost) && maxWidth > 0.0f) {
        measuredWidth = widthMode == YGMeasureModeAtMost ? std::min(measuredWidth, maxWidth) : maxWidth;
    }
    if ((heightMode == YGMeasureModeExactly || heightMode == YGMeasureModeAtMost) && maxHeight > 0.0f) {
        measuredHeight = heightMode == YGMeasureModeAtMost ? std::min(measuredHeight, maxHeight) : maxHeight;
    }

    return {measuredWidth, measuredHeight};
}

void VirtualDOMNode::setYogaNodeSize(float width, float height) {
    if (!_yogaNode) {
        return;
    }

    if (_snapshot && _snapshot->component == "Video") {
        // Release min-size constraints set during surface initialization
        // so the explicit width/height takes effect once the real video dimensions are known
        YGNodeStyleSetMinWidth(_yogaNode, 0.0f);
        YGNodeStyleSetMinHeight(_yogaNode, 0.0f);
    }
    
    YGNodeStyleSetWidth(_yogaNode, width);
    YGNodeStyleSetHeight(_yogaNode, height);
    if (YGNodeHasMeasureFunc(_yogaNode)) {
        YGNodeMarkDirty(_yogaNode);
    }
}
#endif

#if defined(__OHOS__)
void VirtualDOMNode::logYogaLayoutInfo(const ComponentSnapshot& snapshotWithLayout) const {
    if (!_yogaNode) return;

    const std::string& comp   = _snapshot ? _snapshot->component : "?";
    const std::string& nodeId = _id;
    const std::string& pid    = _parentId;

    float lx = snapshotWithLayout.layout.x;
    float ly = snapshotWithLayout.layout.y;
    float lw = snapshotWithLayout.layout.width;
    float lh = snapshotWithLayout.layout.height;

    // flex direction
    const char* flexDir = "?";
    switch (YGNodeStyleGetFlexDirection(_yogaNode)) {
        case YGFlexDirectionColumn:        flexDir = "Column";        break;
        case YGFlexDirectionColumnReverse: flexDir = "ColumnReverse"; break;
        case YGFlexDirectionRow:           flexDir = "Row";           break;
        case YGFlexDirectionRowReverse:    flexDir = "RowReverse";    break;
        default: break;
    }

    // align items
    const char* alignItems = "?";
    switch (YGNodeStyleGetAlignItems(_yogaNode)) {
        case YGAlignAuto:          alignItems = "Auto";          break;
        case YGAlignFlexStart:     alignItems = "FlexStart";     break;
        case YGAlignCenter:        alignItems = "Center";        break;
        case YGAlignFlexEnd:       alignItems = "FlexEnd";       break;
        case YGAlignStretch:       alignItems = "Stretch";       break;
        case YGAlignBaseline:      alignItems = "Baseline";      break;
        case YGAlignSpaceBetween:  alignItems = "SpaceBetween";  break;
        case YGAlignSpaceAround:   alignItems = "SpaceAround";   break;
        default: break;
    }

    // justify content
    const char* justifyContent = "?";
    switch (YGNodeStyleGetJustifyContent(_yogaNode)) {
        case YGJustifyFlexStart:    justifyContent = "FlexStart";    break;
        case YGJustifyCenter:       justifyContent = "Center";       break;
        case YGJustifyFlexEnd:      justifyContent = "FlexEnd";      break;
        case YGJustifySpaceBetween: justifyContent = "SpaceBetween"; break;
        case YGJustifySpaceAround:  justifyContent = "SpaceAround";  break;
        case YGJustifySpaceEvenly:  justifyContent = "SpaceEvenly";  break;
        default: break;
    }

    // position type
    const char* posType = "Relative";
    if (YGNodeStyleGetPositionType(_yogaNode) == YGPositionTypeAbsolute) posType = "Absolute";

    // style width / height
    YGValue styleW = YGNodeStyleGetWidth(_yogaNode);
    YGValue styleH = YGNodeStyleGetHeight(_yogaNode);
    auto ygValueStr = [](YGValue v) -> std::string {
        if (v.unit == YGUnitUndefined) return "Undefined";
        if (v.unit == YGUnitAuto)      return "Auto";
        if (v.unit == YGUnitPercent)   return std::to_string(v.value) + "%";
        return std::to_string(v.value) + "px";
    };

    // min / max
    YGValue minW = YGNodeStyleGetMinWidth(_yogaNode);
    YGValue maxW = YGNodeStyleGetMaxWidth(_yogaNode);
    YGValue minH = YGNodeStyleGetMinHeight(_yogaNode);
    YGValue maxH = YGNodeStyleGetMaxHeight(_yogaNode);

    // padding (all edges)
    float padTop    = YGNodeStyleGetPadding(_yogaNode, YGEdgeTop).value;
    float padRight  = YGNodeStyleGetPadding(_yogaNode, YGEdgeRight).value;
    float padBottom = YGNodeStyleGetPadding(_yogaNode, YGEdgeBottom).value;
    float padLeft   = YGNodeStyleGetPadding(_yogaNode, YGEdgeLeft).value;
    float padAll    = YGNodeStyleGetPadding(_yogaNode, YGEdgeAll).value;
    if (YGNodeStyleGetPadding(_yogaNode, YGEdgeTop).unit    == YGUnitUndefined) padTop    = padAll;
    if (YGNodeStyleGetPadding(_yogaNode, YGEdgeRight).unit  == YGUnitUndefined) padRight  = padAll;
    if (YGNodeStyleGetPadding(_yogaNode, YGEdgeBottom).unit == YGUnitUndefined) padBottom = padAll;
    if (YGNodeStyleGetPadding(_yogaNode, YGEdgeLeft).unit   == YGUnitUndefined) padLeft   = padAll;

    // margin (all edges)
    float marTop    = YGNodeStyleGetMargin(_yogaNode, YGEdgeTop).value;
    float marRight  = YGNodeStyleGetMargin(_yogaNode, YGEdgeRight).value;
    float marBottom = YGNodeStyleGetMargin(_yogaNode, YGEdgeBottom).value;
    float marLeft   = YGNodeStyleGetMargin(_yogaNode, YGEdgeLeft).value;

    // flex grow / shrink / child count
    float flexGrow      = YGNodeStyleGetFlexGrow(_yogaNode);
    float flexShrink    = YGNodeStyleGetFlexShrink(_yogaNode);
    uint32_t childCount = YGNodeGetChildCount(_yogaNode);

    AGENUI_LOG("[checkAndNotifyLayoutChanges] id=%s, type=%s, parentId=%s",
               nodeId.c_str(), comp.c_str(), pid.c_str());
    AGENUI_LOG("  layout:       x=%.1f, y=%.1f, w=%.1f, h=%.1f",
               lx, ly, lw, lh);
    AGENUI_LOG("  yogaStyle:    flexDir=%s, alignItems=%s, justifyContent=%s, posType=%s",
               flexDir, alignItems, justifyContent, posType);
    AGENUI_LOG("  yogaStyle:    styleW=%s, styleH=%s, minW=%s, maxW=%s, minH=%s, maxH=%s",
               ygValueStr(styleW).c_str(), ygValueStr(styleH).c_str(),
               ygValueStr(minW).c_str(), ygValueStr(maxW).c_str(),
               ygValueStr(minH).c_str(), ygValueStr(maxH).c_str());
    AGENUI_LOG("  yogaStyle:    pad(T=%.1f,R=%.1f,B=%.1f,L=%.1f), mar(T=%.1f,R=%.1f,B=%.1f,L=%.1f)",
               padTop, padRight, padBottom, padLeft,
               marTop, marRight, marBottom, marLeft);
    AGENUI_LOG("  yogaStyle:    flexGrow=%.1f, flexShrink=%.1f, childCount=%u",
               flexGrow, flexShrink, childCount);
}
#endif

}  // namespace agenui
