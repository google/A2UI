package com.amap.agenui.render.component.impl;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.widget.HorizontalScrollView;
import android.widget.TableLayout;
import android.widget.TableRow;
import android.widget.TextView;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.style.ComponentStyleConfig;
import com.amap.agenui.render.style.StyleHelper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Table component implementation (conforms to the A2UI v0.9 protocol)
 * <p>
 * Supported properties:
 * - columns:      Array of header column names (String[])
 * - rows:         Array of table data rows (String[][])
 * - styles:       W3C standard style properties
 * - border-width: Border width (supports px)
 * - border-color: Border color (supports hex color)
 * <p>
 * Features:
 * - Supports horizontal scrolling (when the table width exceeds the screen)
 * - Supports disabling horizontal scrolling with automatic cell line wrapping
 * - Fixed header style (bold, background color)
 * - Supports borders and cell padding
 * - Supports striped row effect
 *
 */
public class TableComponent extends A2UIComponent {

    private static final String TAG = "TableComponent";

    private Context context;
    private View rootView;
    private HorizontalScrollView horizontalScrollView;
    private TableLayout tableLayout;

    // Style configuration
    private TableStyleConfig tableStyle;
    private boolean horizontalScroll = true; // Horizontal scrolling enabled by default

    public TableComponent(Context context, String id, Map<String, Object> properties) {
        super(id, "Table");
        this.context = context;
        if (properties != null) {
            this.properties.putAll(properties);
        }
    }

    /**
     * Table style configuration class
     */
    private static class TableStyleConfig {
        int headerBgColor;            // Header background color
        int headerFontColor;          // Header font color
        int headerFontSize;           // Header font size (pixels)
        boolean headerFontBold;       // Whether the header font is bold
        List<Integer> bodyBgColors;   // Data row background color array (supports striped rows)
        int bodyFontColor;            // Data row font color
        int bodyFontSize;             // Data row font size (pixels)
        boolean bodyFontBold;         // Whether the data row font is bold
        int textAlign;                // Text alignment (Gravity)
        int verticalAlign;            // Vertical alignment (Gravity)
        int headerPaddingVertical;    // Header vertical padding (pixels)
        int headerPaddingHorizontal;  // Header horizontal padding (pixels)
        int bodyPaddingVertical;      // Data row vertical padding (pixels)
        int bodyPaddingHorizontal;    // Data row horizontal padding (pixels)
        int minColumnWidth;           // Minimum column width (pixels)
        int maxColumnWidth;           // Maximum column width (pixels)
        boolean horizontalScroll;     // Whether horizontal scrolling is enabled
        int borderWidth;              // Border width (pixels, parsed from styles)
        int borderColor;              // Border color (parsed from styles)
        int borderRadius;             // Border corner radius (pixels, parsed from styles)
    }

    /**
     * Load style configuration
     */
    private ComponentStyleConfig.StyleHashMap<String, String> loadStyleConfig(Context context) {
        ComponentStyleConfig.StyleHashMap<String, String> styleConfig = ComponentStyleConfig.getInstance(context).getTableStyle();
        Log.d(TAG, "Loaded style config: " + styleConfig);
        return styleConfig;
    }

    /**
     * Parse Table style configuration
     *
     * @param styleConfig Style configuration Map
     * @param context     Android Context
     * @return TableStyleConfig object
     */
    private TableStyleConfig loadTableStyle(ComponentStyleConfig.StyleHashMap<String, String> styleConfig, Context context) {
        TableStyleConfig config = new TableStyleConfig();

        // Parse header background color
        String headerBgColor = styleConfig.getOrDefault("header-bg-color", "#EEEFF2");
        config.headerBgColor = StyleHelper.parseColor(headerBgColor);
        Log.d(TAG, "Parsed header-bg-color: " + headerBgColor);

        // Parse header font color
        String headerFontColor = styleConfig.getOrDefault("header-font-color", "#000000");
        config.headerFontColor = StyleHelper.parseColor(headerFontColor);
        Log.d(TAG, "Parsed header-font-color: " + headerFontColor);

        // Parse header font size
        String headerFontSize = styleConfig.getOrDefault("header-font-size", "28px");
        config.headerFontSize = StyleHelper.parseDimension(headerFontSize, context);
        Log.d(TAG, "Parsed header-font-size: " + headerFontSize + " -> " + config.headerFontSize + "px");

        // Parse header font weight
        String headerFontWeight = styleConfig.getOrDefault("header-font-weight", "bold");
        config.headerFontBold = headerFontWeight.equalsIgnoreCase("bold");
        Log.d(TAG, "Parsed header-font-weight: " + headerFontWeight);

        // Parse data row background color array
        config.bodyBgColors = parseBodyBgColors(styleConfig, context);
        Log.d(TAG, "Parsed body-bg-color: " + config.bodyBgColors.size() + " colors");

        // Parse data row font color
        String bodyFontColor = styleConfig.getOrDefault("body-font-color", "#000000");
        config.bodyFontColor = StyleHelper.parseColor(bodyFontColor);
        Log.d(TAG, "Parsed body-font-color: " + bodyFontColor);

        // Parse data row font size
        String bodyFontSize = styleConfig.getOrDefault("body-font-size", "28px");
        config.bodyFontSize = StyleHelper.parseDimension(bodyFontSize, context);
        Log.d(TAG, "Parsed body-font-size: " + bodyFontSize + " -> " + config.bodyFontSize + "px");

        // Parse data row font weight
        String bodyFontWeight = styleConfig.getOrDefault("body-font-weight", "normal");
        config.bodyFontBold = bodyFontWeight.equalsIgnoreCase("bold");
        Log.d(TAG, "Parsed body-font-weight: " + bodyFontWeight);

        // Parse text alignment
        String textAlign = styleConfig.getOrDefault("text-align", "left");
        config.textAlign = parseTextAlign(textAlign);
        Log.d(TAG, "Parsed text-align: " + textAlign);

        // Parse vertical alignment
        String verticalAlign = styleConfig.getOrDefault("vertical-align", "center");
        config.verticalAlign = parseVerticalAlign(verticalAlign);
        Log.d(TAG, "Parsed vertical-align: " + verticalAlign);

        // Parse header vertical padding
        String headerPaddingVertical = styleConfig.getOrDefault("header-padding-vertical", "20px");
        config.headerPaddingVertical = StyleHelper.parseDimension(headerPaddingVertical, context);
        Log.d(TAG, "Parsed header-padding-vertical: " + headerPaddingVertical + " -> " + config.headerPaddingVertical + "px");

        // Parse header horizontal padding
        String headerPaddingHorizontal = styleConfig.getOrDefault("header-padding-horizontal", "32px");
        config.headerPaddingHorizontal = StyleHelper.parseDimension(headerPaddingHorizontal, context);
        Log.d(TAG, "Parsed header-padding-horizontal: " + headerPaddingHorizontal + " -> " + config.headerPaddingHorizontal + "px");

        // Parse data row vertical padding
        String bodyPaddingVertical = styleConfig.getOrDefault("body-padding-vertical", "20px");
        config.bodyPaddingVertical = StyleHelper.parseDimension(bodyPaddingVertical, context);
        Log.d(TAG, "Parsed body-padding-vertical: " + bodyPaddingVertical + " -> " + config.bodyPaddingVertical + "px");

        // Parse data row horizontal padding
        String bodyPaddingHorizontal = styleConfig.getOrDefault("body-padding-horizontal", "32px");
        config.bodyPaddingHorizontal = StyleHelper.parseDimension(bodyPaddingHorizontal, context);
        Log.d(TAG, "Parsed body-padding-horizontal: " + bodyPaddingHorizontal + " -> " + config.bodyPaddingHorizontal + "px");

        // Parse minimum column width
        String minColumnWidth = styleConfig.getOrDefault("min-column-width", "100px");
        config.minColumnWidth = StyleHelper.parseDimension(minColumnWidth, context);
        Log.d(TAG, "Parsed min-column-width: " + minColumnWidth + " -> " + config.minColumnWidth + "px");

        // Parse maximum column width
        String maxColumnWidth = styleConfig.getOrDefault("max-column-width", "600px");
        config.maxColumnWidth = StyleHelper.parseDimension(maxColumnWidth, context);
        Log.d(TAG, "Parsed max-column-width: " + maxColumnWidth + " -> " + config.maxColumnWidth + "px");

        // Parse horizontal scroll switch
        String horizontalScrollStr = styleConfig.getOrDefault("horizontal-scroll", "true");
        config.horizontalScroll = Boolean.parseBoolean(horizontalScrollStr);
        Log.d(TAG, "Parsed horizontal-scroll: " + horizontalScrollStr + " -> " + config.horizontalScroll);

        return config;
    }

    /**
     * Parse body-bg-color array
     */
    private List<Integer> parseBodyBgColors(Map<String, String> styleConfig, Context context) {
        List<Integer> colors = new ArrayList<>();

        String bodyBgColorStr = styleConfig.get("body-bg-color");

        if (bodyBgColorStr != null && bodyBgColorStr.startsWith("[")) {
            // Remove brackets and split by comma
            String cleaned = bodyBgColorStr.substring(1, bodyBgColorStr.length() - 1);
            String[] colorArray = cleaned.split(",");

            for (String colorStr : colorArray) {
                String trimmed = colorStr.trim().replace("\"", "");
                colors.add(StyleHelper.parseColor(trimmed));
            }
        }

        // If parsing fails or result is empty, use default white
        if (colors.isEmpty()) {
            colors.add(Color.WHITE);
        }

        return colors;
    }

    /**
     * Parse text alignment
     */
    private int parseTextAlign(String align) {
        switch (align.toLowerCase()) {
            case "center":
                return Gravity.CENTER_HORIZONTAL;
            case "right":
            case "end":
                return Gravity.END;
            case "left":
            case "start":
            default:
                return Gravity.START;
        }
    }

    /**
     * Parse vertical alignment
     */
    private int parseVerticalAlign(String align) {
        switch (align.toLowerCase()) {
            case "top":
                return Gravity.TOP;
            case "bottom":
                return Gravity.BOTTOM;
            case "center":
            default:
                return Gravity.CENTER_VERTICAL;
        }
    }

    @Override
    protected View onCreateView(Context context) {
        if (this.context == null) {
            this.context = context;
        }

        // Load style configuration
        ComponentStyleConfig.StyleHashMap<String, String> styleConfig = loadStyleConfig(context);
        tableStyle = loadTableStyle(styleConfig, context);

        // Read the horizontalScroll value from configuration
        horizontalScroll = tableStyle.horizontalScroll;

        // Initialize default values for border and corner radius
        tableStyle.borderWidth = 0;
        tableStyle.borderColor = Color.TRANSPARENT;
        tableStyle.borderRadius = 0;

        // Parse border and corner radius styles
        parseStyles(this.properties);

        // Create TableLayout
        tableLayout = new TableLayout(context);

        // Remove TableLayout's default border and background
        tableLayout.setBackground(null);
        tableLayout.setBackgroundColor(Color.TRANSPARENT);

        if (horizontalScroll) {
            // Horizontal scrolling enabled: use HorizontalScrollView as the outer container
            horizontalScrollView = new HorizontalScrollView(context);
            horizontalScrollView.setLayoutParams(new ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
            ));
            horizontalScrollView.setFillViewport(false);  // Set to false to allow content smaller than the viewport

            // Hide scroll bars
            horizontalScrollView.setHorizontalScrollBarEnabled(false);
            horizontalScrollView.setVerticalScrollBarEnabled(false);

            // Remove HorizontalScrollView's default border and background
            horizontalScrollView.setBackground(null);
            horizontalScrollView.setBackgroundColor(Color.TRANSPARENT);

            tableLayout.setLayoutParams(new ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,  // Changed to MATCH_PARENT
                    ViewGroup.LayoutParams.WRAP_CONTENT
            ));
            tableLayout.setStretchAllColumns(false);
            tableLayout.setShrinkAllColumns(false);

            // Add TableLayout to HorizontalScrollView
            horizontalScrollView.addView(tableLayout);
            rootView = horizontalScrollView;
        } else {
            // Horizontal scrolling disabled: TableLayout is used directly as the root view
            tableLayout.setLayoutParams(new ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
            ));
            tableLayout.setStretchAllColumns(true);
            tableLayout.setShrinkAllColumns(true);
            rootView = tableLayout;
        }

        // Apply initial properties
        onUpdateProperties(this.properties);

        return rootView;
    }

    @Override
    protected void onUpdateProperties(Map<String, Object> properties) {
        if (tableLayout == null) {
            return;
        }

        // Parse style configuration (only parse horizontal-scroll and column-weights)
        parseStyles(properties);

        // Clear existing table content
        tableLayout.removeAllViews();

        // Get header and data
        List<String> columns = extractColumns(properties);
        List<List<String>> rows = extractRows(properties);

        // Calculate total number of rows (header + data rows)
        int totalRows = (columns != null && !columns.isEmpty() ? 1 : 0) + (rows != null ? rows.size() : 0);

        // Create header row
        if (columns != null && !columns.isEmpty()) {
            TableRow headerRow = createHeaderRow(columns, totalRows);
            tableLayout.addView(headerRow);
        }

        // Create data rows
        if (rows != null && !rows.isEmpty()) {
            for (int i = 0; i < rows.size(); i++) {
                List<String> rowData = rows.get(i);
                TableRow dataRow = createDataRow(rowData, i, totalRows);
                tableLayout.addView(dataRow);
            }
        }

        // Adjust column widths after layout is complete
        if (horizontalScroll && tableLayout.getChildCount() > 0) {
            tableLayout.getViewTreeObserver().addOnGlobalLayoutListener(
                    new ViewTreeObserver.OnGlobalLayoutListener() {
                        @Override
                        public void onGlobalLayout() {
                            // Remove listener to avoid repeated calls
                            tableLayout.getViewTreeObserver().removeOnGlobalLayoutListener(this);
                            // Adjust column widths
                            adjustColumnWidths();
                        }
                    }
            );
        }
    }

    /**
     * Parse style configuration (only parses border and corner radius)
     */
    private void parseStyles(Map<String, Object> properties) {
        if (!properties.containsKey("styles")) {
            return;
        }

        Object stylesValue = properties.get("styles");
        if (!(stylesValue instanceof Map)) {
            return;
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> styles = (Map<String, Object>) stylesValue;

        // border-width
        if (styles.containsKey("border-width")) {
            Object borderWidthValue = styles.get("border-width");
            String borderWidthStr = String.valueOf(borderWidthValue);
            tableStyle.borderWidth = StyleHelper.parseDimension(borderWidthStr, context);
            Log.d(TAG, "Parsed border-width from styles: " + borderWidthStr + " -> " + tableStyle.borderWidth + "px");
        }

        // border-color
        if (styles.containsKey("border-color")) {
            Object borderColorValue = styles.get("border-color");
            String borderColorStr = String.valueOf(borderColorValue);
            tableStyle.borderColor = StyleHelper.parseColor(borderColorStr);
            Log.d(TAG, "Parsed border-color from styles: " + borderColorStr);
        }

        // border-radius
        if (styles.containsKey("border-radius")) {
            Object borderRadiusValue = styles.get("border-radius");
            String borderRadiusStr = String.valueOf(borderRadiusValue);
            tableStyle.borderRadius = StyleHelper.parseDimension(borderRadiusStr, context);
            Log.d(TAG, "Parsed border-radius from styles: " + borderRadiusStr + " -> " + tableStyle.borderRadius + "px");
        }
    }

    /**
     * Extract header data
     */
    private List<String> extractColumns(Map<String, Object> properties) {
        if (!properties.containsKey("columns")) {
            return null;
        }

        Object columnsValue = properties.get("columns");
        if (!(columnsValue instanceof List)) {
            return null;
        }

        @SuppressWarnings("unchecked")
        List<Object> columnsList = (List<Object>) columnsValue;
        List<String> columns = new ArrayList<>();
        for (Object item : columnsList) {
            columns.add(String.valueOf(item));
        }
        return columns;
    }

    /**
     * Extract data rows
     */
    private List<List<String>> extractRows(Map<String, Object> properties) {
        if (!properties.containsKey("rows")) {
            return null;
        }

        Object rowsValue = properties.get("rows");
        if (!(rowsValue instanceof List)) {
            return null;
        }

        @SuppressWarnings("unchecked")
        List<Object> rowsList = (List<Object>) rowsValue;
        List<List<String>> rows = new ArrayList<>();

        for (Object rowObj : rowsList) {
            if (rowObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<Object> rowList = (List<Object>) rowObj;
                List<String> row = new ArrayList<>();
                for (Object cell : rowList) {
                    row.add(String.valueOf(cell));
                }
                rows.add(row);
            }
        }

        return rows;
    }

    /**
     * Create header row
     */
    private TableRow createHeaderRow(List<String> columns, int totalRows) {
        TableRow row = new TableRow(context);
        row.setLayoutParams(new TableLayout.LayoutParams(
                TableLayout.LayoutParams.MATCH_PARENT,
                TableLayout.LayoutParams.WRAP_CONTENT
        ));

        for (int i = 0; i < columns.size(); i++) {
            TextView cell = createCell(columns.get(i), true, 0, i, columns.size(), totalRows);
            row.addView(cell);
        }

        return row;
    }

    /**
     * Create data row
     */
    private TableRow createDataRow(List<String> rowData, int rowIndex, int totalRows) {
        TableRow row = new TableRow(context);
        row.setLayoutParams(new TableLayout.LayoutParams(
                TableLayout.LayoutParams.MATCH_PARENT,
                TableLayout.LayoutParams.WRAP_CONTENT
        ));

        for (int i = 0; i < rowData.size(); i++) {
            TextView cell = createCell(rowData.get(i), false, rowIndex, i, rowData.size(), totalRows);
            row.addView(cell);
        }

        return row;
    }

    /**
     * Create a cell
     */
    private TextView createCell(String text, boolean isHeader, int rowIndex, int columnIndex, int totalColumns, int totalRows) {
        TextView cell = new TextView(context);

        if (tableStyle == null) {
            return cell;
        }

        // Set text
        cell.setText(text);

        // Set padding (header and body use different padding)
        if (isHeader) {
            cell.setPadding(tableStyle.headerPaddingHorizontal, tableStyle.headerPaddingVertical,
                    tableStyle.headerPaddingHorizontal, tableStyle.headerPaddingVertical);
        } else {
            cell.setPadding(tableStyle.bodyPaddingHorizontal, tableStyle.bodyPaddingVertical,
                    tableStyle.bodyPaddingHorizontal, tableStyle.bodyPaddingVertical);
        }

        // Set text style
        if (isHeader) {
            // Header style
            cell.setTextSize(TypedValue.COMPLEX_UNIT_PX, tableStyle.headerFontSize);
            cell.setTextColor(tableStyle.headerFontColor);
            cell.setTypeface(null, tableStyle.headerFontBold ?
                    Typeface.BOLD : Typeface.NORMAL);
        } else {
            // Data row style
            cell.setTextSize(TypedValue.COMPLEX_UNIT_PX, tableStyle.bodyFontSize);
            cell.setTextColor(tableStyle.bodyFontColor);
            cell.setTypeface(null, tableStyle.bodyFontBold ?
                    Typeface.BOLD : Typeface.NORMAL);
        }

        // Set alignment
        cell.setGravity(tableStyle.verticalAlign | tableStyle.textAlign);

        // Determine background color
        int bgColor;
        if (isHeader) {
            bgColor = tableStyle.headerBgColor;
        } else {
            // Data rows: cycle through striped colors
            int colorIndex = rowIndex % tableStyle.bodyBgColors.size();
            bgColor = tableStyle.bodyBgColors.get(colorIndex);
        }

        // Calculate the actual row index of the current cell (header is row 0)
        int actualRowIndex = isHeader ? 0 : (rowIndex + 1);

        // Determine whether this cell is at one of the four corners
        boolean isTopLeft = (actualRowIndex == 0 && columnIndex == 0);
        boolean isTopRight = (actualRowIndex == 0 && columnIndex == totalColumns - 1);
        boolean isBottomLeft = (actualRowIndex == totalRows - 1 && columnIndex == 0);
        boolean isBottomRight = (actualRowIndex == totalRows - 1 && columnIndex == totalColumns - 1);

        // Create background Drawable
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(bgColor);

        // Set border (if present)
        if (tableStyle.borderWidth > 0) {
            drawable.setStroke(tableStyle.borderWidth, tableStyle.borderColor);
        }

        // Set corner radius (only for corner cells)
        if (tableStyle.borderRadius > 0 && (isTopLeft || isTopRight || isBottomLeft || isBottomRight)) {
            float radius = tableStyle.borderRadius;
            drawable.setCornerRadii(new float[]{
                    isTopLeft ? radius : 0, isTopLeft ? radius : 0,        // Top-left corner
                    isTopRight ? radius : 0, isTopRight ? radius : 0,      // Top-right corner
                    isBottomRight ? radius : 0, isBottomRight ? radius : 0, // Bottom-right corner
                    isBottomLeft ? radius : 0, isBottomLeft ? radius : 0   // Bottom-left corner
            });
        }

        cell.setBackground(drawable);

        // Set cell width based on whether horizontal scrolling is enabled
        if (horizontalScroll) {
            // Horizontal scrolling enabled: start with WRAP_CONTENT; adjustColumnWidths() will adjust later
            TableRow.LayoutParams params = new TableRow.LayoutParams(
                    TableRow.LayoutParams.WRAP_CONTENT,
                    TableRow.LayoutParams.WRAP_CONTENT
            );
            cell.setLayoutParams(params);
        } else {
            // Horizontal scrolling disabled: distribute column widths using layout_weight (equal weights)
            TableRow.LayoutParams params = new TableRow.LayoutParams(
                    0,
                    TableRow.LayoutParams.MATCH_PARENT
            );
            params.weight = 1.0f;
            cell.setLayoutParams(params);

            // Allow automatic line wrapping
            cell.setMaxLines(Integer.MAX_VALUE);
            cell.setSingleLine(false);
        }

        return cell;
    }

    /**
     * Adjust column widths: auto-fit to content, and scale proportionally when total width is less than available width.
     * Performance optimization: only measure the first 10 rows to estimate column widths.
     */
    private void adjustColumnWidths() {
        if (!horizontalScroll || tableLayout.getChildCount() == 0) {
            return;
        }

        // Get the actual available width of HorizontalScrollView (minus padding)
        int availableWidth = horizontalScrollView.getWidth()
                - horizontalScrollView.getPaddingLeft()
                - horizontalScrollView.getPaddingRight();

        // If available width is 0 (layout not yet complete), use screen width as fallback
        if (availableWidth <= 0) {
            availableWidth = context.getResources().getDisplayMetrics().widthPixels;
        }

        // Get minimum and maximum column widths from configuration
        int minColumnWidth = tableStyle.minColumnWidth;
        int maxColumnWidth = tableStyle.maxColumnWidth;

        // Get column count
        TableRow firstRow = (TableRow) tableLayout.getChildAt(0);
        int columnCount = firstRow.getChildCount();

        // Measure the actual width of each column
        int[] columnWidths = new int[columnCount];
        int totalWidth = 0;

        // Performance optimization: only measure the first 10 rows
        int maxRowsToMeasure = Math.min(10, tableLayout.getChildCount());

        for (int col = 0; col < columnCount; col++) {
            int maxWidth = 0;
            // Iterate over the first N rows to find the maximum width for this column
            for (int row = 0; row < maxRowsToMeasure; row++) {
                TableRow tableRow = (TableRow) tableLayout.getChildAt(row);
                View cell = tableRow.getChildAt(col);
                if (cell == null) {
                    continue;
                }
                cell.measure(
                        View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED),
                        View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
                );
                maxWidth = Math.max(maxWidth, cell.getMeasuredWidth());
            }

            // Apply minimum and maximum width constraints
            columnWidths[col] = Math.max(minColumnWidth, Math.min(maxWidth, maxColumnWidth));
            totalWidth += columnWidths[col];
        }

        Log.d(TAG, "Column widths before scaling: totalWidth=" + totalWidth + ", availableWidth=" + availableWidth);

        // If total width is less than available width, scale proportionally
        if (totalWidth < availableWidth) {
            float scale = (float) availableWidth / totalWidth;
            totalWidth = 0;
            for (int col = 0; col < columnCount; col++) {
                int scaledWidth = (int) (columnWidths[col] * scale);
                // Ensure scaled width does not fall below minimum
                columnWidths[col] = Math.max(minColumnWidth, scaledWidth);
                totalWidth += columnWidths[col];
            }
            Log.d(TAG, "Scaled column widths: scale=" + scale + ", newTotalWidth=" + totalWidth);
        }

        // Apply computed column widths to all rows
        for (int row = 0; row < tableLayout.getChildCount(); row++) {
            TableRow tableRow = (TableRow) tableLayout.getChildAt(row);
            for (int col = 0; col < columnCount; col++) {
                View cell = tableRow.getChildAt(col);
                if (cell == null) {
                    continue;
                }
                TableRow.LayoutParams params = (TableRow.LayoutParams) cell.getLayoutParams();
                params.width = columnWidths[col];
                cell.setLayoutParams(params);
            }
        }

        Log.d(TAG, "Column widths adjusted successfully");
    }
}
