#pragma once

#include "../a2ui_component.h"
#include "../../utils/a2ui_color_palette.h"
#include <vector>
#include <map>

namespace a2ui {

/**
 * Table component rendered with the Harmony ArkUI C-API.
 *
 * Supported properties:
 *   - columns: header labels as JSON string[]
 *   - rows: row data as JSON string[][]
 *   - styles:
 *       - border-width: border width, supporting px, default 1px
 *       - border-color: border color, default #e0e0e0
 *       - cell-padding: cell padding, supporting px, default 8px
 *       - header-background: header background color, default #f5f5f5
 *       - stripe: whether zebra striping is enabled, default false
 *       - stripe-color: zebra stripe color, default #f9f9f9
 *
 * Node structure:
 *   ARKUI_NODE_COLUMN (root node, clipped when height is fixed and wrap-content otherwise)
 *     ├── ARKUI_NODE_ROW (header row)
 *     │     ├── ARKUI_NODE_COLUMN + TEXT (header cell)
 *     │     └── ...
 *     ├── ARKUI_NODE_ROW (data row)
 *     │     ├── ARKUI_NODE_COLUMN + TEXT (data cell)
 *     │     └── ...
 *     └── ...
 */
class TableComponent : public A2UIComponent {
public:
    TableComponent(const std::string& id, const nlohmann::json& properties);
    ~TableComponent() override;

    /** Table manages its own child nodes. */
    bool shouldAutoAddChildView() const override { return false; }

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    /** Parse table styling from styles. */
    void parseStyles(const nlohmann::json& properties);

    /** Rebuild the full table. */
    void buildTable(const nlohmann::json& properties);

    /** Load device-specific table styles. */
    void loadComponentStyles();

    /** Create the header row. */
    ArkUI_NodeHandle createHeaderRow(const std::vector<std::string>& columns, float rowWidth, float columnWidth);

    /** Create a data row. */
    ArkUI_NodeHandle createDataRow(const std::vector<std::string>& rowData, bool isOddRow, float rowWidth, float columnWidth, size_t columnCount);

    /**
     * Create a cell using a COLUMN container with a TEXT child.
     */
    ArkUI_NodeHandle createCell(const std::string& text, bool isHeader, bool isOddRow, float columnWidth);

    /** Clear all dynamically created child nodes. */
    void cleanCellNodes();

    /**
     * @brief Equalize cell heights after layout completes.
     */
    void equalizeRowHeights();

    /**
     * @brief Apply exact row heights reported by Yoga in a2ui units.
     * @param rowHeightsJson JSON array string containing one height per row
     */
    void applyYogaRowHeights(const std::string& rowHeightsJson);

    /** Static NODE_EVENT_ON_AREA_CHANGE callback used for initial equalization. */
    static void onAreaChangeCallback(ArkUI_NodeEvent* event);

    /** Parse a dimension string such as "12px" or "12". */
    static float parseSizeValue(const std::string& sizeStr, float defaultValue);

    /** Parse a font-weight string into an ArkUI_FontWeight value. */
    static int32_t parseFontWeight(const std::string& weightStr);

    // Style configuration
    float m_borderWidth = 1.0f;                  // Border width (vp)
    uint32_t m_borderColor = a2ui::colors::kColorBorderGray;  // Border color
    float m_cellPaddingVertical = 20.0f;         // Vertical cell padding in vp
    float m_cellPaddingHorizontal = 32.0f;       // Horizontal cell padding in vp
    uint32_t m_headerBackground = 0xFFEEEFF2;    // Header background color
    bool m_stripe = false;                       // Whether zebra striping is enabled
    uint32_t m_bodyBgColorEven = a2ui::colors::kColorWhite;   // Even row background color
    uint32_t m_bodyBgColorOdd = 0xFFF6F7F8;      // Odd row background color
    float m_minColumnWidth = 100.0f;             // Minimum column width in a2ui
    float m_maxColumnWidth = 600.0f;             // Maximum column width in a2ui

    // Font settings kept in sync with Yoga measurement.
    float m_headerFontSize = 0.0f;               // Header font size, 0 for default
    float m_bodyFontSize = 0.0f;                 // Body font size, 0 for default
    int32_t m_headerFontWeight = 0;              // Header font weight
    int32_t m_bodyFontWeight = 0;                // Body font weight
    bool m_hasHeaderFontSize = false;            // Whether header font size is configured
    bool m_hasBodyFontSize = false;              // Whether body font size is configured
    bool m_hasHeaderFontWeight = false;          // Whether header font weight is configured
    bool m_hasBodyFontWeight = false;            // Whether body font weight is configured

    // Dynamically created nodes tracked for cleanup.
    std::vector<ArkUI_NodeHandle> m_rowNodes;       // Row nodes
    std::vector<ArkUI_NodeHandle> m_cellContainers; // Cell container nodes
    std::vector<ArkUI_NodeHandle> m_cellTextNodes;  // Cell text nodes

    // Row equal-height support.
    // Maps rowIndex -> cell handles for equal-height computation.
    std::map<int, std::vector<ArkUI_NodeHandle>> m_rowCellGroups;
    bool m_areaChangeRegistered = false;  // Whether area change has been registered
    bool m_yogaRowHeightsApplied = false; // Whether exact Yoga row heights have already been applied
};

} // namespace a2ui
