#pragma once

#include "../a2ui_component.h"

namespace a2ui {

/**
 * Vertical layout component backed by ARKUI_NODE_COLUMN.
 *
 * Supported properties:
 *   - justify: main-axis alignment in the vertical direction
 *   - align: cross-axis alignment in the horizontal direction
 *   - styles.background-color / styles.backgroundColor: background color, including #hex and rgba()
 */
class ColumnComponent : public A2UIComponent {
public:
    ColumnComponent(const std::string& id, const nlohmann::json& properties);
    ~ColumnComponent() override;

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    /** Parse justify and map it to NODE_COLUMN_JUSTIFY_CONTENT. */
    void applyJustify(const nlohmann::json& properties);

    /** Parse align and map it to NODE_COLUMN_ALIGN_ITEMS. */
    void applyAlign(const nlohmann::json& properties);

    /** Parse styles and apply background-related attributes. */
    void applyStyles(const nlohmann::json& properties);

    /** Map justify strings to ArkUI enum values. */
    static int32_t mapJustifyContent(const std::string& justify);

    /** Map align strings to ArkUI enum values. */
    static int32_t mapAlignItems(const std::string& align);
};

} // namespace a2ui
