#pragma once

#include "../a2ui_component.h"
#include "../../utils/a2ui_color_palette.h"

namespace a2ui {

/**
 * Slider component backed by ARKUI_NODE_SLIDER.
 *
 * Supported properties:
 *   - value: current value, including numeric and DynamicNumber input
 *   - min: minimum value, default 0
 *   - max: maximum value, default 100
 */
class SliderComponent : public A2UIComponent {
public:
    SliderComponent(const std::string& id, const nlohmann::json& properties);
    ~SliderComponent() override;
    void destroy() override;

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    static void onSliderChangeEvent(ArkUI_NodeEvent* event);

    void applySliderStyles();
    void applyFallbackHeight();
    void updateThumbLayout();
    void destroyInternalNodes();

    /** Apply the minimum value. */
    void applyMinValue(const nlohmann::json& properties);

    /** Apply the maximum value. */
    void applyMaxValue(const nlohmann::json& properties);

    /** Apply the current value after min and max are set. */
    void applyValue(const nlohmann::json& properties);

    /** Extract a numeric value, including string and DynamicNumber input. */
    static float extractNumberValue(const nlohmann::json& value);

    float m_minValue = 0.0f;
    float m_maxValue = 100.0f;
    float m_currentValue = 0.0f;
    float m_sliderHeight = 48.0f;
    float m_trackHeight = 4.0f;
    float m_trackCornerRadius = 2.0f;
    float m_thumbOuterDiameter = 48.0f;
    float m_thumbInnerDiameter = 16.0f;
    uint32_t m_minimumTrackColor = 0xFF1A66FF;
    uint32_t m_maximumTrackColor = 0xFFEEF0F4;
    uint32_t m_thumbOuterColor = a2ui::colors::kColorWhite;
    uint32_t m_thumbInnerColor = 0xFF1A66FF;
    ArkUI_NodeHandle m_maxTrackHandle = nullptr;
    ArkUI_NodeHandle m_minTrackHandle = nullptr;
    ArkUI_NodeHandle m_sliderHandle = nullptr;
    ArkUI_NodeHandle m_thumbOuterHandle = nullptr;
    ArkUI_NodeHandle m_thumbInnerHandle = nullptr;
};

} // namespace a2ui
