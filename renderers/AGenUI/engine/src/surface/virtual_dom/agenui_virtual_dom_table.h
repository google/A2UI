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

class IVirtualDomTable;
class VirtualDOMNode;

/**
 * @brief Table cell data model
 */
class TabelUnitCell {
public:
    std::string text;           // Cell text content
    int title = 0;              // 0=body cell, 1=header cell
    int column = 0;             // Column index
    int row = 0;                // Row index
    int index = 0;              // Linear index in the cells array
    IVirtualDomTable* _tabel = nullptr;  // Owning table object
    ComponentSnapshot cellSnap;
    YGNodeRef yogaNode = nullptr;  // Corresponding Yoga node (used to re-set height after row equalization)
    float measuredHeight = 0.0f;   // Measured height after first layout pass
};

/**
 * @brief Table Yoga node tree builder
 * @remark Holds table data (columns/rows/columnWeights) and is responsible for building the Yoga child node tree
 */
class IVirtualDomTable {
public:
    /**
     * @brief Constructor: parses table data from ComponentSnapshot and initializes Yoga nodes
     * @param snapshot Table component snapshot
     * @param measureTextFunc Text measurement callback (from VirtualDOMNode::measureTextComponent)
     */
    explicit IVirtualDomTable(const ComponentSnapshot& snapshot,
        const std::function<YGSize(const ComponentSnapshot&, float, int&)>& measureTextFunc,
        VirtualDOMNode* parentNode = nullptr);

    /**
     * @brief Destructor: releases the Yoga node tree
     */
    ~IVirtualDomTable();

    /**
     * @brief Get the header column name
     * @param column Column index
     * @return Column name string
     */
    std::string getHeadColumns(int column, int rows) const { return columns[column]; }

    /**
     * @brief Get a data row cell text
     * @param column Column index
     * @param rows Row index
     * @return Cell text
     */
    std::string getUnitColumns(int column, int rows) const { return this->rows[rows][column]; }

    /**
     * @brief Get the root Yoga node of the table
     * @return Yoga node reference
     */
    YGNodeRef getYogaNode() const { return _yogaNode; }

    /**
     * @brief Build the Yoga child node tree for the table
     * @param maxWidth Available maximum width
     */
    void creatCellYogaNode(float maxWidth);

    /**
     * @brief Yoga measure function callback (bound to each cell node)
     */
    static YGSize measureTabelFunction(
        YGNodeRef node,
        float width,
        YGMeasureMode widthMode,
        float height,
        YGMeasureMode heightMode);

    YGNodeRef _yogaNode = nullptr;                                   // Root Yoga node of the table (Column direction)
    ComponentSnapshot _snapshot;                                     // Table component snapshot (passed to cells for style measurement)
    std::vector<std::string> columns;                                // Header column name array
    std::vector<std::vector<std::string>> rows;                      // Data row array (2D)
    std::vector<std::shared_ptr<TabelUnitCell>> cells;               // All cells (in linear order)
    std::vector<float> columnWeights;                                // Column weight array
    float cellPadding = 8.0f;                                        // Cell padding
    float _maxWidth = 0.0f;                                          // Available max width (stored when creatCellYogaNode is called)
    VirtualDOMNode* _parentNode = nullptr;                           // Parent node (used to refresh snapshot in creatCellYogaNode)
    std::function<YGSize(const ComponentSnapshot&, float, int&)> _measureTextFunc;  // Text measurement callback
    std::vector<float> rowHeights;                                   // Row heights after Yoga layout (a2ui units; index 0 = header row)

    /**
     * @brief Get each row's height after Yoga layout (a2ui units)
     * @return Array of row heights (index 0 = header row, 1 = first data row, ...)
     */
    const std::vector<float>& getRowHeights() const { return rowHeights; }

private:
    /**
     * @brief Recursively free the Yoga node tree
     */
    void freeYogaTree(YGNodeRef node);

    /**
     * @brief Parse all table data from snapshot (columns/rows/cellPadding/columnWeights);
     *        clears related member variables before parsing
     */
    void parseSnapshot(const ComponentSnapshot& snapshot);

    /**
     * @brief Parse the header column name array from snapshot.attributes
     */
    void parseColumns(const ComponentSnapshot& snapshot);

    /**
     * @brief Parse the 2D data row array from snapshot.attributes
     */
    void parseRows(const ComponentSnapshot& snapshot);

    /**
     * @brief Parse cell padding from snapshot.styles
     */
    void parseCellPadding(const ComponentSnapshot& snapshot);

    /**
     * @brief Parse the column weight array from snapshot.styles
     */
    void parseColumnWeights(const ComponentSnapshot& snapshot);

    /**
     * @brief Calculate column widths by weight
     * @param colCount Number of columns
     * @param maxWidth Total available width
     * @return Array of column widths
     */
    std::vector<float> calcColumnWidths(int colCount, float maxWidth) const;

    /**
     * @brief Create a cell Yoga node and bind a measure function
     * @param cell     Cell data object
     * @param colWidth Width of the column
     * @param isHeader Whether this is a header cell
     * @return The created Yoga node
     */
    YGNodeRef createCellNode(const std::shared_ptr<TabelUnitCell>& cell, float colWidth, bool isHeader);

    /**
     * @brief Apply header cell styles
     * @param cellNode Yoga node
     * @param cellSnap Cell snapshot
     */
    void setHeadCellStyle(YGNodeRef cellNode, ComponentSnapshot& cellSnap);

    /**
     * @brief Apply body cell styles
     * @param cellNode Yoga node
     * @param cellSnap Cell snapshot
     */
    void setBodyCellStyle(YGNodeRef cellNode, ComponentSnapshot& cellSnap);

    /**
     * @brief Create a header row Yoga node (with all column cells)
     * @param colCount    Number of columns
     * @param colWidths   Column widths
     * @param cellIndex   Current linear index into cells (in/out)
     * @return Header row Yoga node
     */
    YGNodeRef createHeaderRow(int colCount, const std::vector<float>& colWidths, int& cellIndex);

    /**
     * @brief Create a data row Yoga node (with all column cells)
     * @param rowData   Text for each column in this row
     * @param rowIndex  Row index
     * @param colCount  Number of columns
     * @param colWidths Column widths
     * @param cellIndex Current linear index into cells (in/out)
     * @return Data row Yoga node
     */
    YGNodeRef createDataRow(const std::vector<std::string>& rowData, int rowIndex,
                            int colCount, const std::vector<float>& colWidths, int& cellIndex);
};

}  // namespace agenui

#endif // __OHOS__
