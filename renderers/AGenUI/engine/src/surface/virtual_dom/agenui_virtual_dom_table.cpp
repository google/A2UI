#include "agenui_virtual_dom_table.h"
#include "agenui_virtual_dom_node.h"

#if defined(__OHOS__)

#include "agenui_css_style_converter.h"
#include "agenui_a2ui_attribute_converter.h"
#include "agenui_component_snapshot.h"
#include "agenui_log.h"
#include "surface/agenui_serializable_data_impl.h"
#include "nlohmann/json.hpp"

namespace agenui {

IVirtualDomTable::IVirtualDomTable(const ComponentSnapshot& snapshot,
    const std::function<YGSize(const ComponentSnapshot&, float, int&)>& measureTextFunc,
    VirtualDOMNode* parentNode) {
    _measureTextFunc = measureTextFunc;
    _parentNode = parentNode;
    parseSnapshot(snapshot);
    _yogaNode = YGNodeNew();
    YGNodeStyleSetFlexDirection(_yogaNode, YGFlexDirectionColumn);
    YGNodeStyleSetAlignItems(_yogaNode, YGAlignFlexStart);
    YGNodeStyleSetAlignContent(_yogaNode, YGAlignFlexStart);

}

IVirtualDomTable::~IVirtualDomTable() {
    if (_yogaNode) {
        freeYogaTree(_yogaNode);
        _yogaNode = nullptr;
    }
}

void IVirtualDomTable::freeYogaTree(YGNodeRef node) {
    if (!node) return;
    uint32_t count = YGNodeGetChildCount(node);
    for (uint32_t i = 0; i < count; i++) {
        freeYogaTree(YGNodeGetChild(node, i));
    }
    YGNodeFree(node);
}

void IVirtualDomTable::parseSnapshot(const ComponentSnapshot& snapshot) {
    // Clear all parse results first to avoid stale data on re-parse
    columns.clear();
    rows.clear();
    columnWeights.clear();
    _snapshot = snapshot;
    parseColumns(snapshot);
    parseRows(snapshot);
    parseCellPadding(snapshot);
    parseColumnWeights(snapshot);
}

void IVirtualDomTable::parseColumns(const ComponentSnapshot& snapshot) {
    auto it = snapshot.attributes.find(A2UIPropertyNames::kColumns);
    if (it == snapshot.attributes.end() || !it->second.isValid()) return;
    const nlohmann::json& parsed = *it->second.getImpl()->node;
    if (!parsed.is_array()) return;
    for (const auto& col : parsed) {
        columns.push_back(col.is_string() ? col.get<std::string>() : col.dump());
    }
}

void IVirtualDomTable::parseRows(const ComponentSnapshot& snapshot) {
    auto it = snapshot.attributes.find(A2UIPropertyNames::kRows);
    if (it == snapshot.attributes.end() || !it->second.isValid()) return;
    const nlohmann::json& parsed = *it->second.getImpl()->node;
    if (!parsed.is_array()) return;
    for (const auto& rowJson : parsed) {
        if (!rowJson.is_array()) continue;
        std::vector<std::string> row;
        for (const auto& cell : rowJson) {
            row.push_back(cell.is_string() ? cell.get<std::string>() : cell.dump());
        }
        rows.push_back(std::move(row));
    }
}

void IVirtualDomTable::parseCellPadding(const ComponentSnapshot& snapshot) {
    auto it = snapshot.styles.find(CSSPropertyNames::kCellPadding);
    if (it == snapshot.styles.end() || !it->second.isValid()) return;
    if (it->second.isNumber()) {
        cellPadding = it->second.asDouble();
    } else {
        std::string vStr;
        if (it->second.isString()) {
            vStr = it->second.asString();
        } else {
            vStr = it->second.dump();
        }
    size_t pos = vStr.find_first_not_of("0123456789.-");
    if (pos != std::string::npos) vStr = vStr.substr(0, pos);
    if (!vStr.empty()) { try { cellPadding = std::stof(vStr); } catch (...) {} }
    }
}

void IVirtualDomTable::parseColumnWeights(const ComponentSnapshot& snapshot) {
    auto it = snapshot.styles.find(CSSPropertyNames::kColumnWeights);
    if (it == snapshot.styles.end() || !it->second.isArray()) return;
    for (const auto& w : it->second) {
        if (w.isNumber()) columnWeights.push_back(w.asDouble());
        else { try { columnWeights.push_back(std::stof(w.dump())); } catch (...) { columnWeights.push_back(1.0f); } }
    }
}

std::vector<float> IVirtualDomTable::calcColumnWidths(int colCount, float maxWidth) const {
    float totalWeight = 0.0f;
    for (int i = 0; i < colCount; i++) {
        totalWeight += (i < (int)columnWeights.size()) ? columnWeights[i] : 1.0f;
    }
    std::vector<float> colWidths(colCount);
    for (int i = 0; i < colCount; i++) {
        float w = (i < (int)columnWeights.size()) ? columnWeights[i] : 1.0f;
        colWidths[i] = (totalWeight > 0.0f) ? (maxWidth * w / totalWeight) : (maxWidth / colCount);
    }
    return colWidths;
}

void IVirtualDomTable::setHeadCellStyle(YGNodeRef cellNode, ComponentSnapshot& cellSnap) {
    const nlohmann::json& componentStyles = CSSStyleConverter::getDeviceComponentStylesJson();
    if (!componentStyles.contains("Table") || !componentStyles["Table"].is_object()) {
        return;
    }

    const nlohmann::json& tableStyles = componentStyles["Table"];

    // Helper: safely get a string value (returns string directly, or converts number/bool to string)
    auto getStringValue = [&](const std::string& key) -> std::string {
        if (!tableStyles.contains(key)) {
            return "";
        }
        const auto& value = tableStyles[key];
        if (value.is_string()) {
            return value.get<std::string>();
        } else if (value.is_number()) {
            return std::to_string(value.get<double>());
        } else if (value.is_boolean()) {
            return value.get<bool>() ? "true" : "false";
        }
        return "";
    };
    
    // 1. header-font-weight -> font-weight
    std::string headerFontWeight = getStringValue("header-font-weight");
    if (!headerFontWeight.empty()) {
        cellSnap.styles["font-weight"] = SerializableData(SerializableData::Impl::create(headerFontWeight));
    }
    
    // 2. header-font-size -> font-size
    std::string headerFontSize = getStringValue("header-font-size");
    if (!headerFontSize.empty()) {
        cellSnap.styles["font-size"] = SerializableData(SerializableData::Impl::create(headerFontSize));
    }
    
    // 3. Combine text-align and vertical-align
    std::string textAlign = getStringValue("text-align");
    std::string verticalAlign = getStringValue("vertical-align");
    if (!textAlign.empty() && !verticalAlign.empty()) {
        cellSnap.styles["text-align"] = SerializableData(SerializableData::Impl::create(textAlign + " " + verticalAlign));
    }

    // 4. min-column-width -> min-width
    std::string minColumnWidth = getStringValue("min-column-width");
    if (!minColumnWidth.empty()) {
        CSSStyleConverter::applyMinWidth(cellNode, SerializableData(SerializableData::Impl::create(minColumnWidth)));
    }

    // 5. max-column-width -> max-width
    std::string maxColumnWidth = getStringValue("max-column-width");
    if (!maxColumnWidth.empty()) {
        CSSStyleConverter::applyMaxWidth(cellNode, SerializableData(SerializableData::Impl::create(maxColumnWidth)));
    }

    // 6. cell-padding-vertical -> padding-top and padding-bottom
    std::string cellPaddingVertical = getStringValue("cell-padding-vertical");
    if (!cellPaddingVertical.empty()) {
        SerializableData styleValue(SerializableData::Impl::create(cellPaddingVertical));
        CSSStyleConverter::applyPaddingTop(cellNode, styleValue);
        CSSStyleConverter::applyPaddingBottom(cellNode, styleValue);
    }

    // 7. cell-padding-horizontal -> padding-left and padding-right
    std::string cellPaddingHorizontal = getStringValue("cell-padding-horizontal");
    if (!cellPaddingHorizontal.empty()) {
        SerializableData styleValue(SerializableData::Impl::create(cellPaddingHorizontal));
        CSSStyleConverter::applyPaddingLeft(cellNode, styleValue);
        CSSStyleConverter::applyPaddingRight(cellNode, styleValue);
    }
}

void IVirtualDomTable::setBodyCellStyle(YGNodeRef cellNode, ComponentSnapshot& cellSnap) {
    const nlohmann::json& componentStyles = CSSStyleConverter::getDeviceComponentStylesJson();
    if (!componentStyles.contains("Table") || !componentStyles["Table"].is_object()) {
        return;
    }

    const nlohmann::json& tableStyles = componentStyles["Table"];

    // Helper: safely get a string value
    auto getStringValue = [&](const std::string& key) -> std::string {
        if (!tableStyles.contains(key)) {
            return "";
        }
        const auto& value = tableStyles[key];
        if (value.is_string()) {
            return value.get<std::string>();
        } else if (value.is_number()) {
            return std::to_string(value.get<double>());
        } else if (value.is_boolean()) {
            return value.get<bool>() ? "true" : "false";
        }
        return "";
    };
    
    // 1. body-font-size -> font-size
    std::string bodyFontSize = getStringValue("body-font-size");
    if (!bodyFontSize.empty()) {
        cellSnap.styles["font-size"] = SerializableData(SerializableData::Impl::create(bodyFontSize));
    }
    
    // 2. body-font-weight -> font-weight
    std::string bodyFontWeight = getStringValue("body-font-weight");
    if (!bodyFontWeight.empty()) {
        cellSnap.styles["font-weight"] = SerializableData(SerializableData::Impl::create(bodyFontWeight));
    }
    
    // 3. Combine text-align and vertical-align
    std::string textAlign = getStringValue("text-align");
    std::string verticalAlign = getStringValue("vertical-align");
    if (!textAlign.empty() && !verticalAlign.empty()) {
        cellSnap.styles["text-align"] = SerializableData(SerializableData::Impl::create(textAlign + " " + verticalAlign));
    }

    // 4. min-column-width -> min-width
    std::string minColumnWidth = getStringValue("min-column-width");
    if (!minColumnWidth.empty()) {
        CSSStyleConverter::applyMinWidth(cellNode, SerializableData(SerializableData::Impl::create(minColumnWidth)));
    }

    // 5. max-column-width -> max-width
    std::string maxColumnWidth = getStringValue("max-column-width");
    if (!maxColumnWidth.empty()) {
        CSSStyleConverter::applyMaxWidth(cellNode, SerializableData(SerializableData::Impl::create(maxColumnWidth)));
    }

    // 6. cell-padding-vertical -> padding-top and padding-bottom
    std::string cellPaddingVertical = getStringValue("cell-padding-vertical");
    if (!cellPaddingVertical.empty()) {
        SerializableData styleValue(SerializableData::Impl::create(cellPaddingVertical));
        CSSStyleConverter::applyPaddingTop(cellNode, styleValue);
        CSSStyleConverter::applyPaddingBottom(cellNode, styleValue);
    }

    // 7. cell-padding-horizontal -> padding-left and padding-right
    std::string cellPaddingHorizontal = getStringValue("cell-padding-horizontal");
    if (!cellPaddingHorizontal.empty()) {
        SerializableData styleValue(SerializableData::Impl::create(cellPaddingHorizontal));
        CSSStyleConverter::applyPaddingLeft(cellNode, styleValue);
        CSSStyleConverter::applyPaddingRight(cellNode, styleValue);
    }
}

YGNodeRef IVirtualDomTable::createCellNode(const std::shared_ptr<TabelUnitCell>& cell, float colWidth, bool isHeader) {
    YGNodeRef cellNode = YGNodeNew();
    YGNodeStyleSetWidth(cellNode, colWidth);

    cell->cellSnap.component = "Text";
    cell->cellSnap.attributes["text"] = SerializableData(SerializableData::Impl::create(cell->text));
    
    // Apply different styles based on cell type
    if (isHeader) {
        setHeadCellStyle(cellNode, cell->cellSnap);
    } else {
        setBodyCellStyle(cellNode, cell->cellSnap);
    }
    
    CSSStyleConverter::applyCellPadding(cellNode, _snapshot);

    cell->yogaNode = cellNode;  // Save node reference for use by equalizeRowHeights
    YGNodeSetContext(cellNode, cell.get());
    YGNodeSetMeasureFunc(cellNode, measureTabelFunction);
    if (YGNodeHasMeasureFunc(cellNode)) {
        YGNodeMarkDirty(cellNode);
    }

    AGENUI_LOG("createCellNode: text=%s, isHeader=%d, colWidth=%.1f", cell->text.c_str(), isHeader ? 1 : 0, colWidth);

    return cellNode;
}

YGNodeRef IVirtualDomTable::createHeaderRow(int colCount, const std::vector<float>& colWidths, int& cellIndex) {
    YGNodeRef rowNode = YGNodeNew();
    YGNodeStyleSetFlexDirection(rowNode, YGFlexDirectionRow);
    for (int c = 0; c < colCount; c++) {
        std::shared_ptr<TabelUnitCell> cell = std::make_shared<TabelUnitCell>();
        cell->text   = (c < (int)columns.size()) ? columns[c] : "";
        cell->title  = 1;
        cell->column = c;
        cell->row    = -1;
        cell->index  = cellIndex++;
        cell->_tabel = this;
        cells.push_back(cell);

        // Header cell: pass true
        YGNodeInsertChild(rowNode, createCellNode(cell, colWidths[c], true), static_cast<uint32_t>(c));
    }
    return rowNode;
}

YGNodeRef IVirtualDomTable::createDataRow(const std::vector<std::string>& rowData, int rowIndex,
                                           int colCount, const std::vector<float>& colWidths, int& cellIndex) {
    YGNodeRef rowNode = YGNodeNew();
    YGNodeStyleSetFlexDirection(rowNode, YGFlexDirectionRow);

    int actualColCount = static_cast<int>(rowData.size());
    for (int c = 0; c < colCount; c++) {
        std::shared_ptr<TabelUnitCell> cell = std::make_shared<TabelUnitCell>();
        cell->text   = (c < actualColCount) ? rowData[c] : "";
        cell->title  = 0;
        cell->column = c;
        cell->row    = rowIndex;
        cell->index  = cellIndex++;
        cell->_tabel = this;
        cells.push_back(cell);

        // Body cell: pass false
        YGNodeInsertChild(rowNode, createCellNode(cell, colWidths[c], false), static_cast<uint32_t>(c));
    }
    return rowNode;
}

YGSize IVirtualDomTable::measureTabelFunction(
    YGNodeRef node,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode) {

    TabelUnitCell* cell = static_cast<TabelUnitCell*>(YGNodeGetContext(node));
    if (!cell || !cell->_tabel) {
        return {0.0f, 0.0f};
    }
    IVirtualDomTable* tabel = cell->_tabel;

    // Read horizontal padding from the node's actual style to match rendering.
    // Do not use tabel->cellPadding because setHeadCellStyle/setBodyCellStyle may override
    // left/right padding via cell-padding-horizontal, causing a mismatch with cellPadding.
    float paddingLeft  = YGNodeStyleGetPadding(node, YGEdgeLeft).value;
    float paddingRight = YGNodeStyleGetPadding(node, YGEdgeRight).value;
    // Fall back to YGEdgeAll if a single-side padding is not explicitly set
    if (YGNodeStyleGetPadding(node, YGEdgeLeft).unit == YGUnitUndefined) {
        paddingLeft = YGNodeStyleGetPadding(node, YGEdgeAll).value;
    }
    if (YGNodeStyleGetPadding(node, YGEdgeRight).unit == YGUnitUndefined) {
        paddingRight = YGNodeStyleGetPadding(node, YGEdgeAll).value;
    }
    float innerWidth = width - paddingLeft - paddingRight;
    if (innerWidth < 1.0f) innerWidth = 1.0f;

    if (tabel->_measureTextFunc) {
        ComponentSnapshot cellSnap = cell->cellSnap;
        cellSnap.component = "Text";
        cellSnap.attributes["text"] = SerializableData(SerializableData::Impl::create(cell->text));
        int dummyLines = 0;
        YGSize size = tabel->_measureTextFunc(cellSnap, innerWidth, dummyLines);
        AGENUI_LOG("measureTabelFunction: text=%s, innerWidth=%.1f, measuredW=%.1f, measuredH=%.1f, row=%d, col=%d",
                   cell->text.c_str(), innerWidth, size.width, size.height, cell->row, cell->column);
        return {size.width, size.height};
    }
    return {innerWidth, 0.0f};
}

void IVirtualDomTable::creatCellYogaNode(float maxWidth) {
    _maxWidth = maxWidth;
    if (!_parentNode || !_parentNode->getSnapshot()) {
        return;
    }
    _snapshot = *_parentNode->getSnapshot();
    parseSnapshot(_snapshot);

    // Remove old child nodes
    while (YGNodeGetChildCount(_yogaNode) > 0) {
        YGNodeRef child = YGNodeGetChild(_yogaNode, 0);
        YGNodeRemoveChild(_yogaNode, child);
        freeYogaTree(child);
    }
    cells.clear();

    YGNodeStyleSetWidth(_yogaNode, maxWidth);

    int colCount = static_cast<int>(columns.size());
    if (colCount == 0 && !rows.empty()) colCount = static_cast<int>(rows[0].size());
    if (colCount == 0) return;

    std::vector<float> colWidths = calcColumnWidths(colCount, maxWidth);

    int cellIndex = 0;
    uint32_t rowYogaIdx = 0;

    if (!columns.empty()) {
        YGNodeInsertChild(_yogaNode, createHeaderRow(colCount, colWidths, cellIndex), rowYogaIdx++);
    }

    for (int r = 0; r < (int)rows.size(); r++) {
        YGNodeInsertChild(_yogaNode, createDataRow(rows[r], r, colCount, colWidths, cellIndex), rowYogaIdx++);
    }

    YGNodeCalculateLayout(_yogaNode, YGUndefined, YGUndefined, YGDirectionLTR);

    // Log actual width/height of each row/cell after Yoga layout and collect row heights
    uint32_t rowCount = YGNodeGetChildCount(_yogaNode);
    float totalTableHeight = YGNodeLayoutGetHeight(_yogaNode);
    float totalTableWidth = YGNodeLayoutGetWidth(_yogaNode);
    AGENUI_LOG("creatCellYogaNode: maxWidth=%.1f, colCount=%d, rowCount=%u, layoutW=%.1f, layoutH=%.1f",
               maxWidth, colCount, rowCount, totalTableWidth, totalTableHeight);
    rowHeights.clear();
    for (uint32_t r = 0; r < rowCount; r++) {
        YGNodeRef rowChild = YGNodeGetChild(_yogaNode, r);
        float rowW = YGNodeLayoutGetWidth(rowChild);
        float rowH = YGNodeLayoutGetHeight(rowChild);
        float rowTop = YGNodeLayoutGetTop(rowChild);
        AGENUI_LOG("  Row[%u]: top=%.1f, width=%.1f, height=%.1f", r, rowTop, rowW, rowH);
        rowHeights.push_back(rowH);
        uint32_t cellCount = YGNodeGetChildCount(rowChild);
        for (uint32_t c = 0; c < cellCount; c++) {
            YGNodeRef cellChild = YGNodeGetChild(rowChild, c);
            float cellW = YGNodeLayoutGetWidth(cellChild);
            float cellH = YGNodeLayoutGetHeight(cellChild);
            float cellLeft = YGNodeLayoutGetLeft(cellChild);
            AGENUI_LOG("    Cell[%u][%u]: left=%.1f, width=%.1f, height=%.1f", r, c, cellLeft, cellW, cellH);
        }
    }
}

}  // namespace agenui

#endif // __OHOS__
