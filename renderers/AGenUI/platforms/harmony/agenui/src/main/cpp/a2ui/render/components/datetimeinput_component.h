#pragma once

#include <arkui/native_dialog.h>

#include "../a2ui_component.h"
#include "../../utils/a2ui_color_palette.h"

namespace a2ui {

/**
 * Date/time picker component backed by the Harmony ArkUI C-API.
 *
 * Compact structure:
 *   ARKUI_NODE_COLUMN (root node)
 *     ├── ARKUI_NODE_ROW (compact trigger)
 *     │     ├── ARKUI_NODE_TEXT  (placeholder or current value)
 *     │     └── ARKUI_NODE_IMAGE (calendar icon when no value is set)
 *
 * Dialog structure:
 *   ArkUI_NativeDialogHandle (shown on click)
 *     └── ARKUI_NODE_ROW/COLUMN (picker container, hidden by default)
 *           ├── ARKUI_NODE_CALENDAR_PICKER (created on demand)
 *           └── ARKUI_NODE_TIME_PICKER (created on demand)
 *
 * Reads additional styles from g_component_styles.DateTimeInput:
 *   - compact.*
 *   - wheels-2col / wheels-3col / wheels-5col
 */
class DateTimeInputComponent : public A2UIComponent {
public:
    DateTimeInputComponent(const std::string& id, const nlohmann::json& properties);
    ~DateTimeInputComponent() override;

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    struct DialogSession;

    /** Apply the current date/time value. */
    void applyValue(const nlohmann::json& properties);

    /** Apply the date range. */
    void applyRange(const nlohmann::json& properties);

    /** Load additional style configuration. */
    void loadStyleConfig();

    /** Refresh the compact trigger appearance. */
    void updateTriggerAppearance();

    /** Refresh the picker container layout. */
    void updatePickerContainerLayout();

    /** Show the picker dialog. */
    void showPickerDialog();

    /** Dismiss the picker dialog. */
    void dismissPickerDialog();

    /** Parse enableDate and enableTime from properties. */
    void parseEnableFlags(const nlohmann::json& properties);

    /** Extract a string value, including DynamicString input. */
    static std::string extractStringValue(const nlohmann::json& value);

    /** Extract a boolean value, including DynamicBoolean input. */
    static bool extractBooleanValue(const nlohmann::json& value, bool defaultVal);

    /** Parse a style dimension. */
    static float parseStyleDimension(const nlohmann::json& styles, const char* key, float fallbackValue);

    /** Parse a style string. */
    static std::string parseStyleString(const nlohmann::json& styles, const char* key, const std::string& fallbackValue);

    /** Build the icon resource path. */
    static std::string buildIconSrc(const std::string& iconName);

    /** Initialize the default date/time selection. */
    void initializeDefaultSelections();

    /** Compose the display value from the current enable flags. */
    std::string composeCurrentValue() const;

    /** Split the date and time fragments from value. */
    static void splitDateTimeValue(const std::string& value, std::string& datePart, std::string& timePart);

    /** Format a date value. */
    static std::string formatDateValue(int32_t year, int32_t zeroBasedMonth, int32_t day);

    /** Format a time value. */
    static std::string formatTimeValue(int32_t hour, int32_t minute);

    /** Static button click callback that routes through userData. */
    static void onButtonClickCallback(ArkUI_NodeEvent* event);

    /** Date picker change callback. */
    static void onDatePickerChangeCallback(ArkUI_NodeEvent* event);

    /** Time picker change callback. */
    static void onTimePickerChangeCallback(ArkUI_NodeEvent* event);

    /** Dialog disappearance callback. */
    static void onDialogDidDisappear(void* userData);

    /** Dialog dismissal callback. */
    static void onDialogWillDismiss(ArkUI_DialogDismissEvent* event);

    struct CompactStyleConfig {
        float height = 56.0f;
        float fontSize = 24.0f;
        float iconSize = 24.0f;
        float iconSpacing = 6.0f;
        float paddingVertical = 12.0f;
        float paddingHorizontal = 24.0f;
        float cornerRadius = 8.0f;
        float popupCornerRadius = 12.0f;
        uint32_t selectedBackgroundColor = 0x142273F7;
        uint32_t selectedTextColor = a2ui::colors::kColorPrimaryBlue;
        uint32_t unselectedTextColor = a2ui::colors::kColorBlack;
        uint32_t popupMaskColor = 0x66000000;
        std::string placeholderText = "Select date";
        std::string iconName = "event";
    };

    struct WheelStyleConfig {
        float pickerHeight = 368.0f;
        float containerPadding = 16.0f;
        uint32_t backgroundColor = a2ui::colors::kColorWhite;
    };

    bool m_enableDate = true;
    bool m_enableTime = false;
    std::string m_currentValue;
    std::string m_selectedDatePart;
    std::string m_selectedTimePart;

    CompactStyleConfig m_compactStyle;
    WheelStyleConfig m_wheelStyle;

    ArkUI_NodeHandle m_triggerHandle = nullptr;
    ArkUI_NodeHandle m_textHandle = nullptr;
    ArkUI_NodeHandle m_iconHandle = nullptr;
    ArkUI_NodeHandle m_pickerContainerHandle = nullptr;
    ArkUI_NodeHandle m_datePickerHandle = nullptr;
    ArkUI_NodeHandle m_timePickerHandle = nullptr;

    ArkUI_NativeDialogAPI_3* m_dialogAPI = nullptr;
    ArkUI_NativeDialogHandle m_dialogHandle = nullptr;
    DialogSession* m_dialogSession = nullptr;
};

} // namespace a2ui
