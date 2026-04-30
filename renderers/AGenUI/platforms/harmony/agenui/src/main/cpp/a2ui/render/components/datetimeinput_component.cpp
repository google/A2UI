#include "datetimeinput_component.h"

#include "../a2ui_node.h"
#include "log/a2ui_capi_log.h"
#include "../../measure/a2ui_platform_layout_bridge.h"

#include <algorithm>
#include <cctype>
#include <cstdio>
#include <cstdlib>
#include <ctime>

extern const std::string& a2ui_get_files_dir();

namespace a2ui {

namespace {

constexpr uint32_t kUnselectedBackgroundColor = 0xFFF5F5F5;

std::string mapDateTimeIconName(const std::string& iconName) {
    std::string normalized;
    normalized.reserve(iconName.size());
    for (char ch : iconName) {
        normalized.push_back(static_cast<char>(std::tolower(static_cast<unsigned char>(ch))));
    }

    if (normalized == "event" || normalized == "calendartoday" || normalized == "calendar") {
        return "calendar";
    }
    return "calendar";
}

} // namespace

struct DateTimeInputComponent::DialogSession {
    DateTimeInputComponent* owner = nullptr;
    ArkUI_NativeDialogAPI_3* dialogAPI = nullptr;
    ArkUI_NativeDialogHandle dialogHandle = nullptr;
    bool cleaned = false;
};

DateTimeInputComponent::DateTimeInputComponent(const std::string& id, const nlohmann::json& properties)
    : A2UIComponent(id, "DateTimeInput") {
    OH_ArkUI_GetModuleInterface(ARKUI_NATIVE_DIALOG, ArkUI_NativeDialogAPI_3, m_dialogAPI);
    parseEnableFlags(properties);
    loadStyleConfig();
    initializeDefaultSelections();

    m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_COLUMN);
    {
        A2UIColumnNode root(m_nodeHandle);
        root.setAlignItems(ARKUI_ITEM_ALIGNMENT_CENTER);
    }

    m_triggerHandle = g_nodeAPI->createNode(ARKUI_NODE_ROW);
    {
        A2UIRowNode trigger(m_triggerHandle);
        trigger.setAlignItems(ARKUI_VERTICAL_ALIGNMENT_CENTER);
        trigger.setJustifyContent(ARKUI_FLEX_ALIGNMENT_CENTER);
    }
    // Stretch the trigger to fill its parent.
    A2UINode(m_triggerHandle).setPercentWidth(1.0f);
    A2UINode(m_triggerHandle).setPercentHeight(1.0f);
    A2UINode(m_triggerHandle).setPadding(
        m_compactStyle.paddingVertical,
        m_compactStyle.paddingHorizontal,
        m_compactStyle.paddingVertical,
        m_compactStyle.paddingHorizontal);
    A2UINode(m_triggerHandle).setBorderRadius(m_compactStyle.cornerRadius);
    g_nodeAPI->registerNodeEvent(m_triggerHandle, NODE_ON_CLICK, 0, this);
    g_nodeAPI->addNodeEventReceiver(m_triggerHandle, onButtonClickCallback);

    m_textHandle = g_nodeAPI->createNode(ARKUI_NODE_TEXT);
    {
        A2UITextNode text(m_textHandle);
        text.setFontSize(m_compactStyle.fontSize);
        text.setTextMaxLines(1);
        text.setTextOverflowClip();
    }
    g_nodeAPI->addChild(m_triggerHandle, m_textHandle);

    m_iconHandle = g_nodeAPI->createNode(ARKUI_NODE_IMAGE);
    {
        A2UIImageNode icon(m_iconHandle);
        icon.setWidth(m_compactStyle.iconSize);
        icon.setHeight(m_compactStyle.iconSize);
        icon.setObjectFitContain();
        const std::string iconSrc = buildIconSrc(m_compactStyle.iconName);
        if (!iconSrc.empty()) {
            icon.setSrc(iconSrc);
        }
        icon.setFillColor(m_compactStyle.unselectedTextColor);
    }
    A2UINode(m_iconHandle).setMargin(0.0f, 0.0f, 0.0f, m_compactStyle.iconSpacing);
    g_nodeAPI->addChild(m_triggerHandle, m_iconHandle);
    g_nodeAPI->addChild(m_nodeHandle, m_triggerHandle);

    const bool useRowContainer = m_enableDate && m_enableTime;
    m_pickerContainerHandle = g_nodeAPI->createNode(useRowContainer ? ARKUI_NODE_ROW : ARKUI_NODE_COLUMN);
    if (useRowContainer) {
        A2UIRowNode pickerContainer(m_pickerContainerHandle);
        pickerContainer.setAlignItems(ARKUI_VERTICAL_ALIGNMENT_CENTER);
    } else {
        A2UIColumnNode pickerContainer(m_pickerContainerHandle);
        pickerContainer.setAlignItems(ARKUI_ITEM_ALIGNMENT_CENTER);
    }
    A2UINode(m_pickerContainerHandle).setMargin(0.0f, 0.0f, 0.0f, 0.0f);

    if (m_enableDate) {
        m_datePickerHandle = g_nodeAPI->createNode(ARKUI_NODE_DATE_PICKER);
        g_nodeAPI->addNodeEventReceiver(m_datePickerHandle, onDatePickerChangeCallback);
        g_nodeAPI->registerNodeEvent(m_datePickerHandle, NODE_DATE_PICKER_EVENT_ON_DATE_CHANGE, 0, this);
        g_nodeAPI->addChild(m_pickerContainerHandle, m_datePickerHandle);
    }

    if (m_enableTime) {
        m_timePickerHandle = g_nodeAPI->createNode(ARKUI_NODE_TIME_PICKER);
        ArkUI_NumberValue militaryVal[] = {{.i32 = 1}};
        ArkUI_AttributeItem militaryItem = {militaryVal, 1, nullptr, nullptr};
        g_nodeAPI->setAttribute(m_timePickerHandle, NODE_TIME_PICKER_USE_MILITARY_TIME, &militaryItem);
        g_nodeAPI->addNodeEventReceiver(m_timePickerHandle, onTimePickerChangeCallback);
        g_nodeAPI->registerNodeEvent(m_timePickerHandle, NODE_TIME_PICKER_EVENT_ON_CHANGE, 0, this);
        if (m_enableDate) {
            A2UINode(m_timePickerHandle).setMargin(0.0f, 0.0f, 0.0f, 16.0f);
        }
        g_nodeAPI->addChild(m_pickerContainerHandle, m_timePickerHandle);
    }

    if (!properties.is_null() && properties.is_object()) {
        for (auto it = properties.begin(); it != properties.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
    }

    applyValue(m_properties);
    applyRange(m_properties);
    updateTriggerAppearance();
    updatePickerContainerLayout();

    HM_LOGI("DateTimeInputComponent - Created: id=%s, enableDate=%s, enableTime=%s",
            id.c_str(), m_enableDate ? "true" : "false", m_enableTime ? "true" : "false");
}

DateTimeInputComponent::~DateTimeInputComponent() {
    dismissPickerDialog();

    if (m_triggerHandle) {
        g_nodeAPI->unregisterNodeEvent(m_triggerHandle, NODE_ON_CLICK);
    }

    if (m_pickerContainerHandle) {
        if (m_datePickerHandle) {
            g_nodeAPI->unregisterNodeEvent(m_datePickerHandle, NODE_DATE_PICKER_EVENT_ON_DATE_CHANGE);
            g_nodeAPI->removeChild(m_pickerContainerHandle, m_datePickerHandle);
            g_nodeAPI->disposeNode(m_datePickerHandle);
            m_datePickerHandle = nullptr;
        }
        if (m_timePickerHandle) {
            g_nodeAPI->unregisterNodeEvent(m_timePickerHandle, NODE_TIME_PICKER_EVENT_ON_CHANGE);
            g_nodeAPI->removeChild(m_pickerContainerHandle, m_timePickerHandle);
            g_nodeAPI->disposeNode(m_timePickerHandle);
            m_timePickerHandle = nullptr;
        }
    }

    if (m_triggerHandle) {
        if (m_textHandle) {
            g_nodeAPI->removeChild(m_triggerHandle, m_textHandle);
            g_nodeAPI->disposeNode(m_textHandle);
            m_textHandle = nullptr;
        }
        if (m_iconHandle) {
            g_nodeAPI->removeChild(m_triggerHandle, m_iconHandle);
            g_nodeAPI->disposeNode(m_iconHandle);
            m_iconHandle = nullptr;
        }
    }

    if (m_pickerContainerHandle) {
        if (m_nodeHandle) {
            g_nodeAPI->removeChild(m_nodeHandle, m_pickerContainerHandle);
        }
        g_nodeAPI->disposeNode(m_pickerContainerHandle);
        m_pickerContainerHandle = nullptr;
    }

    if (m_triggerHandle) {
        if (m_nodeHandle) {
            g_nodeAPI->removeChild(m_nodeHandle, m_triggerHandle);
        }
        g_nodeAPI->disposeNode(m_triggerHandle);
        m_triggerHandle = nullptr;
    }

    HM_LOGI("DateTimeInputComponent - Destroyed: id=%s", m_id.c_str());
}

void DateTimeInputComponent::onButtonClickCallback(ArkUI_NodeEvent* event) {
    auto* component = static_cast<DateTimeInputComponent*>(OH_ArkUI_NodeEvent_GetUserData(event));
    if (component) {
        component->showPickerDialog();
    }
}

void DateTimeInputComponent::showPickerDialog() {
    if (!m_dialogAPI || !m_pickerContainerHandle) {
        return;
    }

    if (m_dialogHandle) {
        return;
    }

    m_dialogHandle = m_dialogAPI->nativeDialogAPI1.create();
    if (!m_dialogHandle) {
        HM_LOGE("Failed to create dialog, id=%s", m_id.c_str());
        return;
    }

    m_dialogSession = new DialogSession{this, m_dialogAPI, m_dialogHandle};
    m_dialogAPI->nativeDialogAPI1.registerOnWillDismissWithUserData(m_dialogHandle, m_dialogSession, onDialogWillDismiss);
    m_dialogAPI->registerOnDidDisappear(m_dialogHandle, m_dialogSession, onDialogDidDisappear);
    m_dialogAPI->nativeDialogAPI1.setContent(m_dialogHandle, m_pickerContainerHandle);
    m_dialogAPI->nativeDialogAPI1.setModalMode(m_dialogHandle, true);
    m_dialogAPI->nativeDialogAPI1.setAutoCancel(m_dialogHandle, true);
    m_dialogAPI->nativeDialogAPI1.setMask(m_dialogHandle, m_compactStyle.popupMaskColor, nullptr);
    m_dialogAPI->nativeDialogAPI1.setContentAlignment(m_dialogHandle, ARKUI_ALIGNMENT_CENTER, 0, 0);
    m_dialogAPI->nativeDialogAPI1.show(m_dialogHandle, false);

    HM_LOGI("dialog shown, id=%s", m_id.c_str());
}

void DateTimeInputComponent::dismissPickerDialog() {
    if (!m_dialogAPI || !m_dialogHandle) {
        return;
    }

    if (m_dialogSession) {
        m_dialogSession->owner = nullptr;
    }
    m_dialogAPI->nativeDialogAPI1.close(m_dialogHandle);
    if (m_dialogSession && !m_dialogSession->cleaned) {
        m_dialogAPI->nativeDialogAPI1.removeContent(m_dialogHandle);
        m_dialogAPI->nativeDialogAPI1.dispose(m_dialogHandle);
        m_dialogSession->cleaned = true;
    }
    m_dialogHandle = nullptr;
    m_dialogSession = nullptr;
}

void DateTimeInputComponent::onUpdateProperties(const nlohmann::json& properties) {
    if (!m_nodeHandle) {
        HM_LOGE("handle is null, id=%s", m_id.c_str());
        return;
    }

    parseEnableFlags(m_properties);
    loadStyleConfig();
    applyValue(properties);
    applyRange(properties);
    updateTriggerAppearance();
    updatePickerContainerLayout();

    HM_LOGI("Applied properties, id=%s", m_id.c_str());
}

void DateTimeInputComponent::applyValue(const nlohmann::json& properties) {
    if (!properties.contains("value")) {
        if (m_currentValue.empty()) {
            updateTriggerAppearance();
        }
        return;
    }

    const std::string value = extractStringValue(properties["value"]);
    m_currentValue = value;

    if (value.empty()) {
        initializeDefaultSelections();
        updateTriggerAppearance();
        return;
    }

    std::string datePart;
    std::string timePart;
    splitDateTimeValue(value, datePart, timePart);
    if (!datePart.empty()) {
        m_selectedDatePart = datePart;
    }
    if (!timePart.empty()) {
        m_selectedTimePart = timePart;
    }

    if (m_datePickerHandle && !datePart.empty()) {
        ArkUI_AttributeItem dateItem = {nullptr, 0, datePart.c_str(), nullptr};
        g_nodeAPI->setAttribute(m_datePickerHandle, NODE_DATE_PICKER_SELECTED, &dateItem);
    }

    if (m_timePickerHandle && !timePart.empty()) {
        ArkUI_AttributeItem timeItem = {nullptr, 0, timePart.c_str(), nullptr};
        g_nodeAPI->setAttribute(m_timePickerHandle, NODE_TIME_PICKER_SELECTED, &timeItem);
    }

    updateTriggerAppearance();
}

void DateTimeInputComponent::applyRange(const nlohmann::json& properties) {
    if (!m_datePickerHandle) {
        return;
    }

    if (properties.contains("min")) {
        const std::string minValue = extractStringValue(properties["min"]);
        if (!minValue.empty()) {
            const std::string minDate = minValue.substr(0, minValue.find(' '));
            if (!minDate.empty()) {
                A2UIDatePickerNode(m_datePickerHandle).setDatePickerStart(minDate);
            }
        }
    }

    if (properties.contains("max")) {
        const std::string maxValue = extractStringValue(properties["max"]);
        if (!maxValue.empty()) {
            const std::string maxDate = maxValue.substr(0, maxValue.find(' '));
            if (!maxDate.empty()) {
                A2UIDatePickerNode(m_datePickerHandle).setDatePickerEnd(maxDate);
            }
        }
    }
}

void DateTimeInputComponent::loadStyleConfig() {
    const nlohmann::json styles = getComponentStylesFor("DateTimeInput");
    const nlohmann::json compact = styles.contains("compact") && styles["compact"].is_object()
        ? styles["compact"]
        : nlohmann::json::object();

    m_compactStyle.height = parseStyleDimension(compact, "height", m_compactStyle.height);
    m_compactStyle.fontSize = parseStyleDimension(compact, "font-size", m_compactStyle.fontSize);
    m_compactStyle.iconSize = parseStyleDimension(compact, "icon-size", m_compactStyle.iconSize);
    m_compactStyle.iconSpacing = parseStyleDimension(compact, "icon-spacing", m_compactStyle.iconSpacing);
    m_compactStyle.paddingVertical = parseStyleDimension(compact, "padding-vertical", m_compactStyle.paddingVertical);
    m_compactStyle.paddingHorizontal = parseStyleDimension(compact, "padding-horizontal", m_compactStyle.paddingHorizontal);
    m_compactStyle.cornerRadius = parseStyleDimension(compact, "corner-radius", m_compactStyle.cornerRadius);
    m_compactStyle.popupCornerRadius = parseStyleDimension(compact, "popup-corner-radius", m_compactStyle.popupCornerRadius);
    m_compactStyle.placeholderText = parseStyleString(compact, "placeholder-text", m_compactStyle.placeholderText);
    m_compactStyle.iconName = parseStyleString(compact, "icon-name", m_compactStyle.iconName);

    if (compact.contains("selected-background-color") && compact["selected-background-color"].is_string()) {
        m_compactStyle.selectedBackgroundColor = parseColor(compact["selected-background-color"].get<std::string>());
    }
    if (compact.contains("selected-text-color") && compact["selected-text-color"].is_string()) {
        m_compactStyle.selectedTextColor = parseColor(compact["selected-text-color"].get<std::string>());
    }
    if (compact.contains("unselected-text-color") && compact["unselected-text-color"].is_string()) {
        m_compactStyle.unselectedTextColor = parseColor(compact["unselected-text-color"].get<std::string>());
    }
    if (compact.contains("popup-mask-color") && compact["popup-mask-color"].is_string()) {
        m_compactStyle.popupMaskColor = parseColor(compact["popup-mask-color"].get<std::string>());
    }

    const char* wheelKey = m_enableDate && m_enableTime
        ? "wheels-5col"
        : (m_enableDate ? "wheels-3col" : "wheels-2col");
    const nlohmann::json wheelStyle = styles.contains(wheelKey) && styles[wheelKey].is_object()
        ? styles[wheelKey]
        : nlohmann::json::object();

    m_wheelStyle.pickerHeight = parseStyleDimension(wheelStyle, "picker-height", m_wheelStyle.pickerHeight);
    m_wheelStyle.containerPadding = parseStyleDimension(wheelStyle, "container-padding", m_wheelStyle.containerPadding);
    if (wheelStyle.contains("background-color") && wheelStyle["background-color"].is_string()) {
        m_wheelStyle.backgroundColor = parseColor(wheelStyle["background-color"].get<std::string>());
    }
}

void DateTimeInputComponent::updateTriggerAppearance() {
    if (!m_triggerHandle || !m_textHandle || !m_iconHandle) {
        return;
    }

    const bool hasValue = !m_currentValue.empty();
    const std::string displayText = hasValue ? m_currentValue : m_compactStyle.placeholderText;

    A2UITextNode text(m_textHandle);
    text.setTextContent(displayText);
    text.setFontSize(m_compactStyle.fontSize);
    text.setFontColor(hasValue ? m_compactStyle.selectedTextColor : m_compactStyle.unselectedTextColor);
    text.setFontWeight(hasValue ? ARKUI_FONT_WEIGHT_BOLD : ARKUI_FONT_WEIGHT_NORMAL);
    text.setTextMaxLines(1);
    text.setTextOverflowClip();

    A2UINode trigger(m_triggerHandle);
    trigger.setBackgroundColor(hasValue ? m_compactStyle.selectedBackgroundColor : kUnselectedBackgroundColor);
    trigger.setBorderRadius(m_compactStyle.cornerRadius);

    A2UIImageNode icon(m_iconHandle);
    icon.setWidth(m_compactStyle.iconSize);
    icon.setHeight(m_compactStyle.iconSize);
    icon.setFillColor(m_compactStyle.unselectedTextColor);
    const std::string iconSrc = buildIconSrc(m_compactStyle.iconName);
    if (!iconSrc.empty()) {
        icon.setSrc(iconSrc);
    }

    A2UINode(m_iconHandle).setMargin(0.0f, 0.0f, 0.0f, m_compactStyle.iconSpacing);
    A2UINode(m_iconHandle).setVisibility(hasValue ? ARKUI_VISIBILITY_NONE : ARKUI_VISIBILITY_VISIBLE);
}

void DateTimeInputComponent::updatePickerContainerLayout() {
    if (!m_pickerContainerHandle) {
        return;
    }

    A2UINode container(m_pickerContainerHandle);
    container.setBackgroundColor(m_wheelStyle.backgroundColor);
    container.setBorderRadius(m_compactStyle.popupCornerRadius);
    container.setPadding(m_wheelStyle.containerPadding);
    container.setHeight(m_wheelStyle.pickerHeight);
}

void DateTimeInputComponent::parseEnableFlags(const nlohmann::json& properties) {
    m_enableDate = extractBooleanValue(
        properties.contains("enableDate") ? properties["enableDate"] : nlohmann::json(true), true);
    m_enableTime = extractBooleanValue(
        properties.contains("enableTime") ? properties["enableTime"] : nlohmann::json(false), false);
}

std::string DateTimeInputComponent::extractStringValue(const nlohmann::json& value) {
    if (value.is_string()) {
        return value.get<std::string>();
    }

    if (value.is_object()) {
        if (value.contains("value") && value["value"].is_string()) {
            return value["value"].get<std::string>();
        }
        if (value.contains("path") && value["path"].is_string()) {
            return value["path"].get<std::string>();
        }
    }

    return "";
}

bool DateTimeInputComponent::extractBooleanValue(const nlohmann::json& value, bool defaultVal) {
    if (value.is_boolean()) {
        return value.get<bool>();
    }

    if (value.is_string()) {
        const std::string s = value.get<std::string>();
        return s == "true" || s == "1";
    }

    if (value.is_object() && value.contains("value")) {
        return extractBooleanValue(value["value"], defaultVal);
    }

    return defaultVal;
}

float DateTimeInputComponent::parseStyleDimension(const nlohmann::json& styles, const char* key, float fallbackValue) {
    if (!styles.is_object() || !styles.contains(key)) {
        return fallbackValue;
    }

    const auto& value = styles[key];
    try {
        if (value.is_number()) {
            return value.get<float>();
        }
        if (value.is_string()) {
            return std::stof(value.get<std::string>());
        }
    } catch (...) {
        HM_LOGW("DateTimeInputComponent parseStyleNumber: invalid value for '%s', using fallback %f", key, fallbackValue);
    }

    return fallbackValue;
}

std::string DateTimeInputComponent::parseStyleString(const nlohmann::json& styles, const char* key, const std::string& fallbackValue) {
    if (!styles.is_object() || !styles.contains(key) || !styles[key].is_string()) {
        return fallbackValue;
    }
    return styles[key].get<std::string>();
}

std::string DateTimeInputComponent::buildIconSrc(const std::string& iconName) {
    const std::string& filesDir = a2ui_get_files_dir();
    if (filesDir.empty()) {
        return std::string();
    }
    return "file://" + filesDir + "/data/icons/" + mapDateTimeIconName(iconName) + ".svg";
}

void DateTimeInputComponent::initializeDefaultSelections() {
    std::time_t now = std::time(nullptr);
    std::tm localTime{};
#if defined(_WIN32)
    localtime_s(&localTime, &now);
#else
    localtime_r(&now, &localTime);
#endif
    m_selectedDatePart = formatDateValue(localTime.tm_year + 1900, localTime.tm_mon, localTime.tm_mday);
    m_selectedTimePart = formatTimeValue(localTime.tm_hour, localTime.tm_min);
}

std::string DateTimeInputComponent::composeCurrentValue() const {
    if (m_enableDate && m_enableTime) {
        if (m_selectedDatePart.empty() || m_selectedTimePart.empty()) {
            return "";
        }
        return m_selectedDatePart + " " + m_selectedTimePart;
    }
    if (m_enableDate) {
        return m_selectedDatePart;
    }
    if (m_enableTime) {
        return m_selectedTimePart;
    }
    return "";
}

void DateTimeInputComponent::splitDateTimeValue(const std::string& value, std::string& datePart, std::string& timePart) {
    datePart.clear();
    timePart.clear();

    const size_t spacePos = value.find(' ');
    if (spacePos != std::string::npos) {
        datePart = value.substr(0, spacePos);
        timePart = value.substr(spacePos + 1);
    } else if (value.find('-') != std::string::npos) {
        datePart = value;
    } else if (value.find(':') != std::string::npos) {
        timePart = value;
    }
}

std::string DateTimeInputComponent::formatDateValue(int32_t year, int32_t zeroBasedMonth, int32_t day) {
    char buffer[32] = {0};
    std::snprintf(buffer, sizeof(buffer), "%04d-%02d-%02d", year, zeroBasedMonth + 1, day);
    return buffer;
}

std::string DateTimeInputComponent::formatTimeValue(int32_t hour, int32_t minute) {
    char buffer[16] = {0};
    std::snprintf(buffer, sizeof(buffer), "%02d:%02d", hour, minute);
    return buffer;
}

void DateTimeInputComponent::onDatePickerChangeCallback(ArkUI_NodeEvent* event) {
    auto* component = static_cast<DateTimeInputComponent*>(OH_ArkUI_NodeEvent_GetUserData(event));
    if (!component) {
        return;
    }

    ArkUI_NodeComponentEvent* nodeEvent = OH_ArkUI_NodeEvent_GetNodeComponentEvent(event);
    if (!nodeEvent) {
        return;
    }

    component->m_selectedDatePart = formatDateValue(nodeEvent->data[0].i32, nodeEvent->data[1].i32, nodeEvent->data[2].i32);
    component->m_currentValue = component->composeCurrentValue();
    component->updateTriggerAppearance();
}

void DateTimeInputComponent::onTimePickerChangeCallback(ArkUI_NodeEvent* event) {
    auto* component = static_cast<DateTimeInputComponent*>(OH_ArkUI_NodeEvent_GetUserData(event));
    if (!component) {
        return;
    }

    ArkUI_NodeComponentEvent* nodeEvent = OH_ArkUI_NodeEvent_GetNodeComponentEvent(event);
    if (!nodeEvent) {
        return;
    }

    component->m_selectedTimePart = formatTimeValue(nodeEvent->data[0].i32, nodeEvent->data[1].i32);
    component->m_currentValue = component->composeCurrentValue();
    component->updateTriggerAppearance();
}

void DateTimeInputComponent::onDialogDidDisappear(void* userData) {
    auto* session = static_cast<DialogSession*>(userData);
    if (!session) {
        return;
    }
    if (!session->dialogAPI || !session->dialogHandle) {
        delete session;
        return;
    }

    if (!session->cleaned) {
        session->dialogAPI->nativeDialogAPI1.removeContent(session->dialogHandle);
        session->dialogAPI->nativeDialogAPI1.dispose(session->dialogHandle);
        session->cleaned = true;
    }

    if (session->owner && session->owner->m_dialogSession == session) {
        session->owner->m_dialogHandle = nullptr;
        session->owner->m_dialogSession = nullptr;
    }

    delete session;
}

void DateTimeInputComponent::onDialogWillDismiss(ArkUI_DialogDismissEvent* event) {
    if (!event) {
        return;
    }

    auto* session = static_cast<DialogSession*>(OH_ArkUI_DialogDismissEvent_GetUserData(event));
    if (!session || !session->owner) {
        return;
    }

    if (session->owner->m_dialogSession == session) {
        session->owner->m_dialogHandle = nullptr;
        session->owner->m_dialogSession = nullptr;
    }
    session->owner = nullptr;
}

} // namespace a2ui
