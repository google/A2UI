#include "slider_component.h"
#include "../a2ui_node.h"
#include "../../utils/a2ui_color_palette.h"
#include "agenui_platform_layout_bridge.h"
#include "agenui_engine_entry.h"
#include "log/a2ui_capi_log.h"
#include <algorithm>
#include <string>

#undef LOG_DOMAIN
#undef LOG_TAG
#define LOG_DOMAIN 0x0000
#define LOG_TAG "A2UI_SliderComponent"

namespace a2ui {

namespace {

const nlohmann::json& getSliderStyleConfig() {
    static std::string cachedRaw;
    static nlohmann::json cachedConfig = nlohmann::json::object();

    agenui::IPlatformLayoutBridge* platformLayoutBridge = agenui::getAGenUIEngine()->getPlatformLayoutBridge();
    if (platformLayoutBridge == nullptr) {
        return cachedConfig;
    }

    const char* rawStyles = platformLayoutBridge->getComponentStyles();
    if (rawStyles == nullptr) {
        return cachedConfig;
    }

    const std::string rawString(rawStyles);
    if (rawString == cachedRaw) {
        return cachedConfig;
    }

    cachedRaw = rawString;
    try {
        nlohmann::json parsed = nlohmann::json::parse(rawString);
        if (parsed.contains("Slider") && parsed["Slider"].is_object()) {
            cachedConfig = parsed["Slider"];
        } else {
            cachedConfig = nlohmann::json::object();
        }
    } catch (...) {
        HM_LOGW("getSliderStyleConfig: failed to parse component styles JSON, using empty config");
        cachedConfig = nlohmann::json::object();
    }

    return cachedConfig;
}

float parseDimensionValue(const nlohmann::json& styleConfig, const char* key, float fallbackValue) {
    if (!styleConfig.is_object() || !styleConfig.contains(key)) {
        return fallbackValue;
    }

    const nlohmann::json& value = styleConfig[key];
    try {
        if (value.is_number()) {
            return value.get<float>();
        }
        if (value.is_string()) {
            return std::stof(value.get<std::string>());
        }
    } catch (...) {
        HM_LOGW("parseDimensionValue: failed to parse '%s', using fallback %f", key, fallbackValue);
    }
    return fallbackValue;
}

std::string parseColorString(const nlohmann::json& styleConfig, const char* key, const std::string& fallbackValue) {
    if (!styleConfig.is_object() || !styleConfig.contains(key) || !styleConfig[key].is_string()) {
        return fallbackValue;
    }
    return styleConfig[key].get<std::string>();
}

}  // namespace

SliderComponent::SliderComponent(const std::string& id, const nlohmann::json& properties)
    : A2UIComponent(id, "Slider") {

    m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_STACK);
    m_maxTrackHandle = g_nodeAPI->createNode(ARKUI_NODE_STACK);
    m_minTrackHandle = g_nodeAPI->createNode(ARKUI_NODE_STACK);
    m_sliderHandle = g_nodeAPI->createNode(ARKUI_NODE_SLIDER);
    m_thumbOuterHandle = g_nodeAPI->createNode(ARKUI_NODE_STACK);
    m_thumbInnerHandle = g_nodeAPI->createNode(ARKUI_NODE_STACK);

    {
        A2UINode maxTrack(m_maxTrackHandle);
        maxTrack.setBackgroundColor(m_maximumTrackColor);
        maxTrack.setBorderRadius(m_trackCornerRadius);
        maxTrack.setHitTestBehavior(ARKUI_HIT_TEST_MODE_TRANSPARENT);
    }

    {
        A2UINode minTrack(m_minTrackHandle);
        minTrack.setBackgroundColor(m_minimumTrackColor);
        minTrack.setBorderRadius(m_trackCornerRadius);
        minTrack.setHitTestBehavior(ARKUI_HIT_TEST_MODE_TRANSPARENT);
    }

    {
        A2UISliderNode slider(m_sliderHandle);
        slider.setDirection(ARKUI_SLIDER_DIRECTION_HORIZONTAL);
        slider.setStyle(ARKUI_SLIDER_STYLE_OUT_SET);
        slider.setMinValue(0.0f);
        slider.setMaxValue(100.0f);
        slider.setValue(0.0f);
        slider.setBlockColor(colors::kColorTransparent);
        slider.setBlockCircleStyle(1.0f);
        slider.setSelectedColor(colors::kColorTransparent);
        slider.setTrackColor(colors::kColorTransparent);
    }

    {
        A2UINode thumbOuter(m_thumbOuterHandle);
        thumbOuter.setBackgroundColor(m_thumbOuterColor);
        thumbOuter.setBorderRadius(m_thumbOuterDiameter * 0.5f);
        thumbOuter.setHitTestBehavior(ARKUI_HIT_TEST_MODE_TRANSPARENT);
        thumbOuter.setCustomShadow(6.0f, 0.0f, 2.0f, colors::kColorShadow20);
    }

    {
        A2UINode thumbInner(m_thumbInnerHandle);
        thumbInner.setBackgroundColor(m_thumbInnerColor);
        thumbInner.setBorderRadius(m_thumbInnerDiameter * 0.5f);
        thumbInner.setHitTestBehavior(ARKUI_HIT_TEST_MODE_TRANSPARENT);
    }

    A2UIContainerNode rootNode(m_nodeHandle);
    rootNode.appendChild(m_maxTrackHandle);
    rootNode.appendChild(m_minTrackHandle);
    rootNode.appendChild(m_sliderHandle);
    rootNode.appendChild(m_thumbOuterHandle);
    rootNode.appendChild(m_thumbInnerHandle);

    g_nodeAPI->addNodeEventReceiver(m_sliderHandle, onSliderChangeEvent);
    g_nodeAPI->registerNodeEvent(m_sliderHandle, NODE_SLIDER_EVENT_ON_CHANGE, 0, this);

    applySliderStyles();
    applyFallbackHeight();
    updateThumbLayout();

    // Merge initial properties.
    if (!properties.is_null() && properties.is_object()) {
        for (auto it = properties.begin(); it != properties.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
    }

    HM_LOGI("SliderComponent - Created: id=%s, handle=%s", id.c_str(), m_nodeHandle ? "valid" : "null");
}

SliderComponent::~SliderComponent() {
    HM_LOGI("SliderComponent - Destroyed: id=%s", m_id.c_str());
}

void SliderComponent::destroy() {
    destroyInternalNodes();
    A2UIComponent::destroy();
}

// ---- Property Updates ----

void SliderComponent::onUpdateProperties(const nlohmann::json& properties) {
    if (!m_nodeHandle || !m_sliderHandle) {
        HM_LOGE("handle is null, id=%s", m_id.c_str());
        return;
    }

    applySliderStyles();
    applyFallbackHeight();

    // Apply min/max before value so clamping uses the latest range.
    applyMinValue(properties);
    applyMaxValue(properties);
    applyValue(properties);
    updateThumbLayout();

    HM_LOGI("Applied properties, id=%s", m_id.c_str());
}

void SliderComponent::applySliderStyles() {
    if (!m_maxTrackHandle || !m_minTrackHandle || !m_sliderHandle || !m_thumbOuterHandle || !m_thumbInnerHandle) {
        return;
    }

    const nlohmann::json& styleConfig = getSliderStyleConfig();
    m_sliderHeight = parseDimensionValue(styleConfig, "slider-height", 48.0f);
    m_trackHeight = parseDimensionValue(styleConfig, "track-height", 4.0f) ;
    m_trackCornerRadius = parseDimensionValue(styleConfig, "track-corner-radius", m_trackHeight * 0.5f);
    m_thumbOuterDiameter = parseDimensionValue(styleConfig, "thumb-outer-diameter", m_sliderHeight);
    m_thumbOuterDiameter = std::max(m_thumbOuterDiameter, 1.0f);
    m_thumbInnerDiameter = std::min(
        parseDimensionValue(styleConfig, "thumb-inner-diameter", 16.0f),
        m_thumbOuterDiameter);

    const std::string minimumTrackColor = parseColorString(styleConfig, "minimum-track-color", "#1A66FF");
    const std::string maximumTrackColor = parseColorString(styleConfig, "maximum-track-color", "#EEF0F4");
    const std::string thumbOuterColor = parseColorString(styleConfig, "thumb-outer-color", "#FFFFFF");
    const std::string thumbInnerColor = parseColorString(styleConfig, "thumb-inner-color", "#1A66FF");

    m_minimumTrackColor = parseColor(minimumTrackColor);
    m_maximumTrackColor = parseColor(maximumTrackColor);
    m_thumbOuterColor = parseColor(thumbOuterColor);
    m_thumbInnerColor = parseColor(thumbInnerColor);

    A2UISliderNode slider(m_sliderHandle);
    slider.setStyle(ARKUI_SLIDER_STYLE_OUT_SET);
    slider.setTrackThickness(m_trackHeight);
    slider.setSelectedColor(colors::kColorTransparent);
    slider.setTrackColor(colors::kColorTransparent);
    slider.setBlockColor(colors::kColorTransparent);
    slider.setBlockCircleStyle(1.0f);

    {
        A2UINode maxTrack(m_maxTrackHandle);
        maxTrack.setBackgroundColor(m_maximumTrackColor);
        maxTrack.setBorderRadius(m_trackCornerRadius);
    }

    {
        A2UINode minTrack(m_minTrackHandle);
        minTrack.setBackgroundColor(m_minimumTrackColor);
        minTrack.setBorderRadius(m_trackCornerRadius);
    }

    {
        A2UINode thumbOuter(m_thumbOuterHandle);
        thumbOuter.setBackgroundColor(m_thumbOuterColor);
        thumbOuter.setBorderRadius(m_thumbOuterDiameter * 0.5f);
        thumbOuter.setCustomShadow(6.0f, 0.0f, 2.0f, colors::kColorShadow20);
    }

    {
        A2UINode thumbInner(m_thumbInnerHandle);
        thumbInner.setBackgroundColor(m_thumbInnerColor);
        thumbInner.setBorderRadius(m_thumbInnerDiameter * 0.5f);
    }
}

void SliderComponent::applyFallbackHeight() {
    const float fallbackHeight = std::max(m_sliderHeight, m_thumbOuterDiameter);
    if (getHeight() <= 1.0f) {
        setHeight(fallbackHeight);
        HM_LOGI("Applied fallback height: %.1f", fallbackHeight);
    }
}

void SliderComponent::updateThumbLayout() {
    if (!m_sliderHandle || !m_thumbOuterHandle || !m_thumbInnerHandle) {
        return;
    }

    const float componentWidth = std::max(getWidth(), m_thumbOuterDiameter);
    const float componentHeight = std::max(getHeight(), m_sliderHeight);
    const float trackHeight = std::max(m_trackHeight, 1.0f);
    const float trackRadius = std::max(std::min(m_trackCornerRadius, trackHeight * 0.5f), 0.0f);
    const float outerDiameter = std::max(m_thumbOuterDiameter, 1.0f);
    const float innerDiameter = std::max(std::min(m_thumbInnerDiameter, outerDiameter), 1.0f);

    {
        A2UINode sliderNode(m_sliderHandle);
        sliderNode.setPosition(0.0f, 0.0f);
        sliderNode.setWidth(componentWidth);
        sliderNode.setHeight(componentHeight);
    }

    float ratio = 0.0f;
    const float range = m_maxValue - m_minValue;
    if (range > 0.0f) {
        ratio = std::clamp((m_currentValue - m_minValue) / range, 0.0f, 1.0f);
    }

    const float thumbTravel = std::max(componentWidth - outerDiameter, 0.0f);
    const float thumbLeft = ratio * thumbTravel;
    const float thumbTop = std::max((componentHeight - outerDiameter) * 0.5f, 0.0f);
    const float thumbCenter = thumbLeft + outerDiameter * 0.5f;
    const float trackTop = std::max((componentHeight - trackHeight) * 0.5f, 0.0f);
    const float selectedTrackWidth = std::clamp(thumbCenter, 0.0f, componentWidth);
    const float innerLeft = thumbLeft + (outerDiameter - innerDiameter) * 0.5f;
    const float innerTop = thumbTop + (outerDiameter - innerDiameter) * 0.5f;

    {
        A2UINode maxTrack(m_maxTrackHandle);
        maxTrack.setWidth(componentWidth);
        maxTrack.setHeight(trackHeight);
        maxTrack.setPosition(0.0f, trackTop);
        maxTrack.setBorderRadius(trackRadius);
    }

    {
        A2UINode minTrack(m_minTrackHandle);
        minTrack.setWidth(selectedTrackWidth);
        minTrack.setHeight(trackHeight);
        minTrack.setPosition(0.0f, trackTop);
        minTrack.setBorderRadius(trackRadius);
    }

    {
        A2UINode thumbOuter(m_thumbOuterHandle);
        thumbOuter.setWidth(outerDiameter);
        thumbOuter.setHeight(outerDiameter);
        thumbOuter.setPosition(thumbLeft, thumbTop);
        thumbOuter.setBorderRadius(outerDiameter * 0.5f);
    }

    {
        A2UINode thumbInner(m_thumbInnerHandle);
        thumbInner.setWidth(innerDiameter);
        thumbInner.setHeight(innerDiameter);
        thumbInner.setPosition(innerLeft, innerTop);
        thumbInner.setBorderRadius(innerDiameter * 0.5f);
    }
}

void SliderComponent::destroyInternalNodes() {
    if (!m_nodeHandle) {
        m_maxTrackHandle = nullptr;
        m_minTrackHandle = nullptr;
        m_sliderHandle = nullptr;
        m_thumbOuterHandle = nullptr;
        m_thumbInnerHandle = nullptr;
        return;
    }

    if (m_sliderHandle) {
        g_nodeAPI->unregisterNodeEvent(m_sliderHandle, NODE_SLIDER_EVENT_ON_CHANGE);
        g_nodeAPI->removeChild(m_nodeHandle, m_sliderHandle);
        g_nodeAPI->disposeNode(m_sliderHandle);
        m_sliderHandle = nullptr;
    }

    if (m_maxTrackHandle) {
        g_nodeAPI->removeChild(m_nodeHandle, m_maxTrackHandle);
        g_nodeAPI->disposeNode(m_maxTrackHandle);
        m_maxTrackHandle = nullptr;
    }

    if (m_minTrackHandle) {
        g_nodeAPI->removeChild(m_nodeHandle, m_minTrackHandle);
        g_nodeAPI->disposeNode(m_minTrackHandle);
        m_minTrackHandle = nullptr;
    }

    if (m_thumbOuterHandle) {
        g_nodeAPI->removeChild(m_nodeHandle, m_thumbOuterHandle);
        g_nodeAPI->disposeNode(m_thumbOuterHandle);
        m_thumbOuterHandle = nullptr;
    }

    if (m_thumbInnerHandle) {
        g_nodeAPI->removeChild(m_nodeHandle, m_thumbInnerHandle);
        g_nodeAPI->disposeNode(m_thumbInnerHandle);
        m_thumbInnerHandle = nullptr;
    }
}

// ---- Min Value ----

void SliderComponent::applyMinValue(const nlohmann::json& properties) {
    if (!properties.contains("min")) {
        return;
    }

    float minVal = extractNumberValue(properties["min"]);
    m_minValue = minVal;
    A2UISliderNode(m_sliderHandle).setMinValue(minVal);

    HM_LOGI("Set min: %f", minVal);
}

// ---- Max Value ----

void SliderComponent::applyMaxValue(const nlohmann::json& properties) {
    if (!properties.contains("max")) {
        return;
    }

    float maxVal = extractNumberValue(properties["max"]);
    m_maxValue = maxVal;
    A2UISliderNode(m_sliderHandle).setMaxValue(maxVal);

    HM_LOGI("Set max: %f", maxVal);
}

// ---- Value ----

void SliderComponent::applyValue(const nlohmann::json& properties) {
    if (!properties.contains("value")) {
        return;
    }

    float value = extractNumberValue(properties["value"]);

    // Clamp the value into the active range.
    value = std::max(m_minValue, std::min(m_maxValue, value));
    m_currentValue = value;
    A2UISliderNode(m_sliderHandle).setValue(value);

    HM_LOGI("Set value: %f (range: %f ~ %f)", value, m_minValue, m_maxValue);
}

void SliderComponent::onSliderChangeEvent(ArkUI_NodeEvent* event) {
    void* userData = OH_ArkUI_NodeEvent_GetUserData(event);
    if (!userData) {
        return;
    }

    SliderComponent* self = static_cast<SliderComponent*>(userData);
    ArkUI_NodeComponentEvent* nodeEvent = OH_ArkUI_NodeEvent_GetNodeComponentEvent(event);
    if (!nodeEvent) {
        return;
    }

    self->m_currentValue = std::max(self->m_minValue, std::min(self->m_maxValue, nodeEvent->data[0].f32));
    self->updateThumbLayout();
}

// ---- Number Extraction ----

float SliderComponent::extractNumberValue(const nlohmann::json& value) {
    // Raw number.
    if (value.is_number()) {
        return value.get<float>();
    }

    // Numeric string.
    if (value.is_string()) {
        try {
            return std::stof(value.get<std::string>());
        } catch (...) {
            HM_LOGW("parseSliderNumber: invalid numeric string '%s', defaulting to 0", value.get<std::string>().c_str());
            return 0.0f;
        }
    }

    // DynamicNumber format: {"literalNumber": 50}
    if (value.is_object() && value.contains("literalNumber")) {
        const auto& literalNumber = value["literalNumber"];
        if (literalNumber.is_number()) {
            return literalNumber.get<float>();
        }
        if (literalNumber.is_string()) {
            try {
                return std::stof(literalNumber.get<std::string>());
            } catch (...) {
                HM_LOGW("parseSliderNumber: invalid literalNumber string '%s', defaulting to 0", literalNumber.get<std::string>().c_str());
                return 0.0f;
            }
        }
    }

    return 0.0f;
}

} // namespace a2ui
