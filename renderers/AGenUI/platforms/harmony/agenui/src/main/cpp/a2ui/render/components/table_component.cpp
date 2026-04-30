#include "table_component.h"
#include "../a2ui_node.h"
#include "../../measure/a2ui_platform_layout_bridge.h"
#include "../../utils/a2ui_color_palette.h"
#include "../../utils/a2ui_font_weight_utils.h"
#include "hilog/log.h"
#include <cstdlib>
#include <cstring>
#include <algorithm>
#include <map>
#include "log/a2ui_capi_log.h"

#undef LOG_DOMAIN
#undef LOG_TAG
#define LOG_DOMAIN 0x0000
#define LOG_TAG "A2UI_TableComponent"

namespace a2ui {

TableComponent::TableComponent(const std::string& id, const nlohmann::json& properties)
    : A2UIComponent(id, "Table") {

    m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_COLUMN);
    A2UINode(m_nodeHandle).setWidth(-1.0f);
    {
        A2UIColumnNode rootCol(m_nodeHandle);
        rootCol.setJustifyContent(ARKUI_FLEX_ALIGNMENT_START);
        rootCol.setAlignItems(ARKUI_ITEM_ALIGNMENT_START);
    }

    if (!properties.is_null() && properties.is_object()) {
        for (auto it = properties.begin(); it != properties.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
    }

    HM_LOGI("TableComponent - Created: id=%s, handle=%s", id.c_str(), m_nodeHandle ? "valid" : "null");
}

TableComponent::~TableComponent() {
    cleanCellNodes();
    HM_LOGI("TableComponent - Destroyed: id=%s", m_id.c_str());
}

// ---- Property Updates ----

void TableComponent::onUpdateProperties(const nlohmann::json& properties) {
    (void)properties;
    if (!m_nodeHandle) {
        HM_LOGE("handle is null, id=%s", m_id.c_str());
        return;
    }

    const nlohmann::json& mergedProperties = m_properties;

    parseStyles(mergedProperties);
    buildTable(mergedProperties);

    bool appliedYogaHeights = false;
    if (mergedProperties.find("styles") != mergedProperties.end() &&
        mergedProperties["styles"].is_object() &&
        mergedProperties["styles"].contains("--table-row-heights")) {
        const auto& rh = mergedProperties["styles"]["--table-row-heights"];
        std::string rowHeightsJson = rh.is_string() ? rh.get<std::string>() : rh.dump();
        if (!rowHeightsJson.empty() && rowHeightsJson != "null") {
            applyYogaRowHeights(rowHeightsJson);
            appliedYogaHeights = true;
        }
    }
    (void)appliedYogaHeights;

    HM_LOGI("Applied properties, id=%s", m_id.c_str());
}


void TableComponent::parseStyles(const nlohmann::json& properties) {
    loadComponentStyles();

    if (properties.find("styles") == properties.end() || !properties["styles"].is_object()) {
        return;
    }

    const auto& styles = properties["styles"];

    if (styles.find("border-width") != styles.end()) {
        if (styles["border-width"].is_string()) {
            m_borderWidth = parseSizeValue(styles["border-width"].get<std::string>(), m_borderWidth);
        } else if (styles["border-width"].is_number()) {
            m_borderWidth = styles["border-width"].get<float>();
        }
        HM_LOGI("Overriding border-width from properties.styles: %.1f", m_borderWidth);
    }

    if (styles.find("border-color") != styles.end() && styles["border-color"].is_string()) {
        m_borderColor = parseColor(styles["border-color"].get<std::string>());
        HM_LOGI("Overriding border-color from properties.styles: 0x%08X", m_borderColor);
    }

    if (styles.find("border-radius") != styles.end()) {
        float borderRadius = 0.0f;
        if (styles["border-radius"].is_string()) {
            borderRadius = parseSizeValue(styles["border-radius"].get<std::string>(), 0.0f);
        } else if (styles["border-radius"].is_number()) {
            borderRadius = styles["border-radius"].get<float>();
        }
        HM_LOGI("border-radius from properties.styles: %.1f (not implemented yet)", borderRadius);
    }
}

void TableComponent::loadComponentStyles() {
    const nlohmann::json componentStyles = getComponentStylesFor("Table");
    if (!componentStyles.is_object()) {
        return;
    }

    // min-column-width
    if (componentStyles.contains("min-column-width")) {
        if (componentStyles["min-column-width"].is_string()) {
            m_minColumnWidth = parseSizeValue(componentStyles["min-column-width"].get<std::string>(), m_minColumnWidth);
        } else if (componentStyles["min-column-width"].is_number()) {
            m_minColumnWidth = componentStyles["min-column-width"].get<float>();
        }
    }

    // max-column-width
    if (componentStyles.contains("max-column-width")) {
        if (componentStyles["max-column-width"].is_string()) {
            m_maxColumnWidth = parseSizeValue(componentStyles["max-column-width"].get<std::string>(), m_maxColumnWidth);
        } else if (componentStyles["max-column-width"].is_number()) {
            m_maxColumnWidth = componentStyles["max-column-width"].get<float>();
        }
    }

    if (componentStyles.contains("cell-padding-vertical")) {
        if (componentStyles["cell-padding-vertical"].is_string()) {
            m_cellPaddingVertical = parseSizeValue(componentStyles["cell-padding-vertical"].get<std::string>(), m_cellPaddingVertical);
        } else if (componentStyles["cell-padding-vertical"].is_number()) {
            m_cellPaddingVertical = componentStyles["cell-padding-vertical"].get<float>();
        }
    }

    if (componentStyles.contains("cell-padding-horizontal")) {
        if (componentStyles["cell-padding-horizontal"].is_string()) {
            m_cellPaddingHorizontal = parseSizeValue(componentStyles["cell-padding-horizontal"].get<std::string>(), m_cellPaddingHorizontal);
        } else if (componentStyles["cell-padding-horizontal"].is_number()) {
            m_cellPaddingHorizontal = componentStyles["cell-padding-horizontal"].get<float>();
        }
    }

    if (componentStyles.contains("header-bg-color") && componentStyles["header-bg-color"].is_string()) {
        m_headerBackground = parseColor(componentStyles["header-bg-color"].get<std::string>());
        HM_LOGI("Loaded header-bg-color: %s -> 0x%08X", 
                componentStyles["header-bg-color"].get<std::string>().c_str(), m_headerBackground);
    } else {
        HM_LOGI("Using default header-bg-color: 0x%08X", m_headerBackground);
    }

    if (componentStyles.contains("body-bg-color")) {
        const auto& bodyBgColor = componentStyles["body-bg-color"];
        if (bodyBgColor.is_array() && bodyBgColor.size() >= 2) {
            m_stripe = true;
            if (bodyBgColor[0].is_string()) {
                m_bodyBgColorEven = parseColor(bodyBgColor[0].get<std::string>());
            }
            if (bodyBgColor[1].is_string()) {
                m_bodyBgColorOdd = parseColor(bodyBgColor[1].get<std::string>());
            }
        } else if (bodyBgColor.is_string()) {
            m_stripe = false;
            m_bodyBgColorEven = parseColor(bodyBgColor.get<std::string>());
            m_bodyBgColorOdd = m_bodyBgColorEven;
        }
    }

    m_borderWidth = 0.0f;
    m_borderColor = colors::kColorTransparent;

    // header-font-size
    m_hasHeaderFontSize = false;
    if (componentStyles.contains("header-font-size")) {
        if (componentStyles["header-font-size"].is_string()) {
            m_headerFontSize = parseSizeValue(componentStyles["header-font-size"].get<std::string>(), 0.0f);
        } else if (componentStyles["header-font-size"].is_number()) {
            m_headerFontSize = componentStyles["header-font-size"].get<float>();
        }
        m_hasHeaderFontSize = (m_headerFontSize > 0.0f);
    }

    // header-font-weight
    m_hasHeaderFontWeight = false;
    if (componentStyles.contains("header-font-weight")) {
        std::string weightStr;
        if (componentStyles["header-font-weight"].is_string()) {
            weightStr = componentStyles["header-font-weight"].get<std::string>();
        } else if (componentStyles["header-font-weight"].is_number()) {
            weightStr = std::to_string(componentStyles["header-font-weight"].get<int>());
        }
        if (!weightStr.empty()) {
            m_headerFontWeight = parseFontWeight(weightStr);
            m_hasHeaderFontWeight = true;
        }
    }

    // body-font-size
    m_hasBodyFontSize = false;
    if (componentStyles.contains("body-font-size")) {
        if (componentStyles["body-font-size"].is_string()) {
            m_bodyFontSize = parseSizeValue(componentStyles["body-font-size"].get<std::string>(), 0.0f);
        } else if (componentStyles["body-font-size"].is_number()) {
            m_bodyFontSize = componentStyles["body-font-size"].get<float>();
        }
        m_hasBodyFontSize = (m_bodyFontSize > 0.0f);
    }

    // body-font-weight
    m_hasBodyFontWeight = false;
    if (componentStyles.contains("body-font-weight")) {
        std::string weightStr;
        if (componentStyles["body-font-weight"].is_string()) {
            weightStr = componentStyles["body-font-weight"].get<std::string>();
        } else if (componentStyles["body-font-weight"].is_number()) {
            weightStr = std::to_string(componentStyles["body-font-weight"].get<int>());
        }
        if (!weightStr.empty()) {
            m_bodyFontWeight = parseFontWeight(weightStr);
            m_hasBodyFontWeight = true;
        }
    }

    HM_LOGI("cellPaddingV=%.1f, cellPaddingH=%.1f, stripe=%d, border reset to 0, headerFontSize=%.1f, bodyFontSize=%.1f", 
            m_cellPaddingVertical, m_cellPaddingHorizontal, m_stripe ? 1 : 0, m_headerFontSize, m_bodyFontSize);
}


void TableComponent::buildTable(const nlohmann::json& properties) {
    cleanCellNodes();

    std::vector<std::string> columns;
    if (properties.find("columns") != properties.end() && properties["columns"].is_array()) {
        for (const auto& col : properties["columns"]) {
            if (col.is_string()) {
                columns.push_back(col.get<std::string>());
            }
        }
    }

    std::vector<std::vector<std::string>> rows;
    if (properties.find("rows") != properties.end() && properties["rows"].is_array()) {
        for (const auto& row : properties["rows"]) {
            if (row.is_array()) {
                std::vector<std::string> rowData;
                for (const auto& cell : row) {
                    if (cell.is_string()) {
                        rowData.push_back(cell.get<std::string>());
                    } else {
                        rowData.push_back(cell.dump());
                    }
                }
                rows.push_back(rowData);
            }
        }
    }

    if (columns.empty()) {
        HM_LOGW("No columns defined, id=%s", m_id.c_str());
        return;
    }

    float tableWidth = getWidth();
    if (tableWidth <= 0.0f) {
        A2UIPlatformLayoutBridge platformLayoutBridge;
        tableWidth = static_cast<float>(platformLayoutBridge.getDeviceWidth());
    }
    if (tableWidth <= 0.0f) {
        tableWidth = 600.0f;
    }

    const float safeMinColumnWidth = std::max(m_minColumnWidth, 1.0f);
    const float safeMaxColumnWidth = std::max(m_maxColumnWidth, safeMinColumnWidth);
    const float rawColumnWidth = tableWidth / static_cast<float>(columns.size());
    const float columnWidth = std::min(std::max(rawColumnWidth, safeMinColumnWidth), safeMaxColumnWidth);
    const float resolvedTableWidth = std::max(tableWidth, columnWidth * static_cast<float>(columns.size()));

    A2UINode(m_nodeHandle).setWidth(resolvedTableWidth);

    float fixedHeight = getHeight();
    bool hasFixedHeight = (fixedHeight > 0.0f);
    if (hasFixedHeight) {
        A2UINode(m_nodeHandle).setHeight(fixedHeight);
    }

    ArkUI_NodeHandle headerRow = createHeaderRow(columns, resolvedTableWidth, columnWidth);
    if (headerRow) {
        if (hasFixedHeight) {
            A2UINode(headerRow).setLayoutWeight(1.0f);
        }
        g_nodeAPI->addChild(m_nodeHandle, headerRow);
        m_rowNodes.push_back(headerRow);
    }

    for (size_t i = 0; i < rows.size(); i++) {
        bool isOddRow = (i % 2 == 1);
        ArkUI_NodeHandle dataRow = createDataRow(rows[i], isOddRow, resolvedTableWidth, columnWidth, columns.size());
        if (dataRow) {
            if (hasFixedHeight) {
                A2UINode(dataRow).setLayoutWeight(1.0f);
            }
            g_nodeAPI->addChild(m_nodeHandle, dataRow);
            m_rowNodes.push_back(dataRow);
        }
    }

    if (!m_areaChangeRegistered && m_nodeHandle) {
        g_nodeAPI->addNodeEventReceiver(m_nodeHandle, onAreaChangeCallback);
        g_nodeAPI->registerNodeEvent(m_nodeHandle, NODE_EVENT_ON_AREA_CHANGE, 0, this);
        m_areaChangeRegistered = true;
        HM_LOGI("Registered area change for row height equalization, id=%s", m_id.c_str());
    }

    HM_LOGI("Built table: %zu columns, %zu rows, tableWidth=%.1f, columnWidth=%.1f, id=%s",
        columns.size(), rows.size(), resolvedTableWidth, columnWidth, m_id.c_str());
}


ArkUI_NodeHandle TableComponent::createHeaderRow(const std::vector<std::string>& columns, float rowWidth, float columnWidth) {
    ArkUI_NodeHandle row = g_nodeAPI->createNode(ARKUI_NODE_ROW);

    A2UINode(row).setWidth(rowWidth);
    {
        A2UIRowNode r(row);
        r.setJustifyContent(ARKUI_FLEX_ALIGNMENT_START);
    }

    const int rowIndex = -1;
    for (const auto& colName : columns) {
        ArkUI_NodeHandle cell = createCell(colName, true, false, columnWidth);
        if (cell) {
            g_nodeAPI->addChild(row, cell);
            m_rowCellGroups[rowIndex].push_back(cell);
        }
    }

    return row;
}


ArkUI_NodeHandle TableComponent::createDataRow(const std::vector<std::string>& rowData, bool isOddRow, float rowWidth, float columnWidth, size_t columnCount) {
    ArkUI_NodeHandle row = g_nodeAPI->createNode(ARKUI_NODE_ROW);

    A2UINode(row).setWidth(rowWidth);
    {
        A2UIRowNode r(row);
        r.setJustifyContent(ARKUI_FLEX_ALIGNMENT_START);
    }

    int rowIndex = static_cast<int>(m_rowCellGroups.size()) - 1;
    int dataRowCount = 0;
    for (const auto& kv : m_rowCellGroups) {
        if (kv.first >= 0) dataRowCount++;
    }
    rowIndex = dataRowCount;

    for (const auto& cellText : rowData) {
        ArkUI_NodeHandle cell = createCell(cellText, false, isOddRow, columnWidth);
        if (cell) {
            g_nodeAPI->addChild(row, cell);
            m_rowCellGroups[rowIndex].push_back(cell);
        }
    }

    for (size_t i = rowData.size(); i < columnCount; ++i) {
        ArkUI_NodeHandle cell = createCell("", false, isOddRow, columnWidth);
        if (cell) {
            g_nodeAPI->addChild(row, cell);
            m_rowCellGroups[rowIndex].push_back(cell);
        }
    }

    return row;
}


ArkUI_NodeHandle TableComponent::createCell(const std::string& text, bool isHeader, bool isOddRow, float columnWidth) {
    ArkUI_NodeHandle container = g_nodeAPI->createNode(ARKUI_NODE_COLUMN);

    uint32_t bgColor = m_bodyBgColorEven;
    if (isHeader) {
        bgColor = m_headerBackground;
    } else if (m_stripe && isOddRow) {
        bgColor = m_bodyBgColorOdd;
    }

    {
        A2UIColumnNode col(container);
        col.setWidth(columnWidth);
        col.setAlignItems(ARKUI_ITEM_ALIGNMENT_START);
        col.setJustifyContent(ARKUI_FLEX_ALIGNMENT_CENTER);
        col.setPadding(m_cellPaddingVertical, m_cellPaddingHorizontal, m_cellPaddingVertical, m_cellPaddingHorizontal);
        col.setBorderWidth(m_borderWidth, m_borderWidth, m_borderWidth, m_borderWidth);
        col.setBorderColor(m_borderColor);
        col.setBackgroundColor(bgColor);

        if (getHeight() > 0.0f) {
            col.setHeight(-1.0f);  // match_parent
        }
    }

    ArkUI_NodeHandle textNode = g_nodeAPI->createNode(ARKUI_NODE_TEXT);
    float textWidth = columnWidth - 2.0f * m_cellPaddingHorizontal;
    if (textWidth < 1.0f) textWidth = 1.0f;

    {
        A2UITextNode t(textNode);
        t.setTextContent(text);
        t.setWidth(textWidth);
        t.setTextAlign(ARKUI_TEXT_ALIGNMENT_START);

        if (isHeader) {
            if (m_hasHeaderFontSize) {
                t.setFontSize(m_headerFontSize);
            }
            if (m_hasHeaderFontWeight) {
                t.setFontWeight(static_cast<ArkUI_FontWeight>(m_headerFontWeight));
            }
        } else {
            if (m_hasBodyFontSize) {
                t.setFontSize(m_bodyFontSize);
            }
            if (m_hasBodyFontWeight) {
                t.setFontWeight(static_cast<ArkUI_FontWeight>(m_bodyFontWeight));
            }
        }
    }

    g_nodeAPI->addChild(container, textNode);

    m_cellContainers.push_back(container);
    m_cellTextNodes.push_back(textNode);

    return container;
}


void TableComponent::cleanCellNodes() {
    if (m_areaChangeRegistered && m_nodeHandle) {
        g_nodeAPI->unregisterNodeEvent(m_nodeHandle, NODE_EVENT_ON_AREA_CHANGE);
        g_nodeAPI->removeNodeEventReceiver(m_nodeHandle, onAreaChangeCallback);
        m_areaChangeRegistered = false;
    }
    m_yogaRowHeightsApplied = false;

    m_rowCellGroups.clear();

    for (auto rowNode : m_rowNodes) {
        if (rowNode && m_nodeHandle) {
            g_nodeAPI->removeChild(m_nodeHandle, rowNode);
        }
    }

    for (auto textNode : m_cellTextNodes) {
        if (textNode) {
            g_nodeAPI->disposeNode(textNode);
        }
    }
    m_cellTextNodes.clear();

    for (auto container : m_cellContainers) {
        if (container) {
            g_nodeAPI->disposeNode(container);
        }
    }
    m_cellContainers.clear();

    for (auto rowNode : m_rowNodes) {
        if (rowNode) {
            g_nodeAPI->disposeNode(rowNode);
        }
    }
    m_rowNodes.clear();
}

// ---- Helper Methods ----

float TableComponent::parseSizeValue(const std::string& sizeStr, float defaultValue) {
    if (sizeStr.empty()) {
        return defaultValue;
    }

    std::string numStr = sizeStr;
    size_t pos = numStr.find_first_not_of("0123456789.-");
    if (pos != std::string::npos) {
        numStr = numStr.substr(0, pos);
    }

    if (numStr.empty()) {
        return defaultValue;
    }

    float value = static_cast<float>(std::atof(numStr.c_str()));
    return value > 0.0f ? value : defaultValue;
}

int32_t TableComponent::parseFontWeight(const std::string& weightStr) {
    if (weightStr.empty()) return ARKUI_FONT_WEIGHT_NORMAL;
    if (weightStr == "bold") return ARKUI_FONT_WEIGHT_BOLD;
    if (weightStr == "normal") return ARKUI_FONT_WEIGHT_NORMAL;
    if (weightStr == "medium") return ARKUI_FONT_WEIGHT_MEDIUM;
    if (weightStr == "regular") return ARKUI_FONT_WEIGHT_REGULAR;
    if (weightStr == "bolder") return ARKUI_FONT_WEIGHT_BOLDER;
    if (weightStr == "lighter") return ARKUI_FONT_WEIGHT_LIGHTER;
    try {
        return font_weight::mapNumericToArkUIFontWeight(std::stoi(weightStr));
    } catch (...) {
        HM_LOGW("parseFontWeight: invalid numeric weight '%s', falling back to NORMAL", weightStr.c_str());
    }
    return ARKUI_FONT_WEIGHT_NORMAL;
}


void TableComponent::applyYogaRowHeights(const std::string& rowHeightsJson) {
    nlohmann::json arr = nlohmann::json::parse(rowHeightsJson, nullptr, false);
    if (arr.is_discarded() || !arr.is_array() || arr.empty()) {
        HM_LOGW("invalid rowHeightsJson: %s", rowHeightsJson.c_str());
        return;
    }

    size_t rowCount = std::min(arr.size(), m_rowNodes.size());
    for (size_t i = 0; i < rowCount; i++) {
        float heightA2ui = arr[i].is_number() ? arr[i].get<float>() : 0.0f;
        if (heightA2ui <= 0.0f) continue;
        float heightVp = UnitConverter::a2uiToVp(heightA2ui);

        ArkUI_NodeHandle rowNode = m_rowNodes[i];
        if (rowNode) {
            ArkUI_NumberValue rowValue[] = {{.f32 = heightVp}};
            ArkUI_AttributeItem rowItem = {rowValue, 1};
            g_nodeAPI->setAttribute(rowNode, NODE_HEIGHT, &rowItem);
        }

        int rowKey = static_cast<int>(i) - 1;
        auto it = m_rowCellGroups.find(rowKey);
        if (it != m_rowCellGroups.end()) {
            for (ArkUI_NodeHandle cell : it->second) {
                if (!cell) continue;
                ArkUI_NumberValue cellPctValue[] = {{.f32 = 1.0f}};
                ArkUI_AttributeItem cellPctItem = {cellPctValue, 1};
                g_nodeAPI->setAttribute(cell, NODE_HEIGHT_PERCENT, &cellPctItem);
            }
        }

        HM_LOGI("Row[%zu]: a2ui=%.1f, vp=%.1f", i, heightA2ui, heightVp);
    }
    m_yogaRowHeightsApplied = true;
}


void TableComponent::equalizeRowHeights() {
    if (m_rowCellGroups.empty()) return;

    if (m_yogaRowHeightsApplied) {
        HM_LOGI("skipped (Yoga row heights already applied), id=%s", m_id.c_str());
        return;
    }

    HM_LOGI("Start equalizing row heights, id=%s", m_id.c_str());

    auto rowNodeForIndex = [&](int rowIndex) -> ArkUI_NodeHandle {
        size_t nodeIdx = static_cast<size_t>(rowIndex + 1);
        if (nodeIdx < m_rowNodes.size()) {
            return m_rowNodes[nodeIdx];
        }
        return nullptr;
    };

    for (auto& kv : m_rowCellGroups) {
        const auto& cellHandles = kv.second;
        if (cellHandles.empty()) continue;

        float maxHeight = 0.0f;
        for (ArkUI_NodeHandle cell : cellHandles) {
            if (!cell) continue;
            ArkUI_IntSize size = g_nodeAPI->getMeasuredSize(cell);
            float cellHeightVp = UnitConverter::pxToVp(static_cast<float>(size.height));
            if (cellHeightVp > maxHeight) {
                maxHeight = cellHeightVp;
            }
        }

        if (maxHeight <= 0.0f) continue;

        for (ArkUI_NodeHandle cell : cellHandles) {
            if (!cell) continue;
            ArkUI_NumberValue pctValue[] = {{.f32 = 1.0f}};
            ArkUI_AttributeItem pctItem = {pctValue, 1};
            g_nodeAPI->setAttribute(cell, NODE_HEIGHT_PERCENT, &pctItem);
        }

        ArkUI_NodeHandle rowNode = rowNodeForIndex(kv.first);
        if (rowNode) {
            ArkUI_NumberValue rowValue[] = {{.f32 = maxHeight}};
            ArkUI_AttributeItem rowItem = {rowValue, 1};
            g_nodeAPI->setAttribute(rowNode, NODE_HEIGHT, &rowItem);
        }

        HM_LOGI("Row %d: maxHeight=%.1fvp, %zu cells",
                kv.first, maxHeight, cellHandles.size());
    }
}


void TableComponent::onAreaChangeCallback(ArkUI_NodeEvent* event) {
    if (!event) return;
    TableComponent* self = static_cast<TableComponent*>(OH_ArkUI_NodeEvent_GetUserData(event));
    if (!self) return;

    HM_LOGI("First layout done, equalizing row heights, id=%s", self->m_id.c_str());

    self->equalizeRowHeights();

    if (self->m_areaChangeRegistered && self->m_nodeHandle) {
        g_nodeAPI->unregisterNodeEvent(self->m_nodeHandle, NODE_EVENT_ON_AREA_CHANGE);
        g_nodeAPI->removeNodeEventReceiver(self->m_nodeHandle, onAreaChangeCallback);
        self->m_areaChangeRegistered = false;
    }
}

} // namespace a2ui
