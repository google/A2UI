#pragma once

#include <memory>
#include <string>
#include <cstdint>
#include <nlohmann/json.hpp>
#include "agenui_platform_layout_bridge.h"

namespace a2ui {

/**
 * @brief Set device screen information during ETS-side initialization.
 * @param width Screen width in px
 * @param height Screen height in px
 * @param density Screen density, such as 3.375
 */
void setDeviceInfo(int width, int height, float density);

/**
 * @brief Return the screen density used by rendering components.
 * @return Screen density, default 3.375f
 */
float getScreenDensity();

/**
 * @brief Read component-specific style configuration from g_component_styles.
 * @param componentName Component name such as "CheckBox" or "Tabs"
 * @return Style JSON for the component, or an empty object if missing
 */
nlohmann::json getComponentStylesFor(const std::string& componentName);

/**
 * @brief Set the global image fade-in switch.
 * @param enabled True to enable fade-in, false to disable it
 */
void setImageFadeInEnabled(bool enabled);

/**
 * @brief Return whether image fade-in is enabled globally.
 */
bool isImageFadeInEnabled();

/**
 * @brief Return the image fade-in duration.
 * @return Duration in milliseconds
 */
int32_t getImageFadeInDurationMs();

class A2UITextMeasurement : public agenui::IPlatformLayoutBridge::ITextMeasurement {
public:
    A2UITextMeasurement() = default;
    ~A2UITextMeasurement() override = default;
    
    agenui::IPlatformLayoutBridge::MeasureSize measure(
        const agenui::IPlatformLayoutBridge::TextMeasureParam &param,
        float width,
        agenui::IPlatformLayoutBridge::MeasureMode widthMode,
        float height,
        agenui::IPlatformLayoutBridge::MeasureMode heightMode) override;

    float getBaselineOfFirstLine(
        const agenui::IPlatformLayoutBridge::TextMeasureParam &param,
        float width,
        agenui::IPlatformLayoutBridge::MeasureMode widthMode,
        float height,
        agenui::IPlatformLayoutBridge::MeasureMode heightMode) override;
};

class A2UIImgMeasurement : public agenui::IPlatformLayoutBridge::IImgMeasurement {
public:
    A2UIImgMeasurement() = default;
    ~A2UIImgMeasurement() override = default;

    agenui::IPlatformLayoutBridge::MeasureSize measure(
        const agenui::IPlatformLayoutBridge::ImgMeasureParam &param,
        float width,
        agenui::IPlatformLayoutBridge::MeasureMode widthMode,
        float height,
        agenui::IPlatformLayoutBridge::MeasureMode heightMode) override;
};

class A2UILottieMeasurement : public agenui::IPlatformLayoutBridge::ILottieMeasurement {
public:
    A2UILottieMeasurement() = default;
    ~A2UILottieMeasurement() override = default;

    agenui::IPlatformLayoutBridge::MeasureSize measure(
        const agenui::IPlatformLayoutBridge::LottieMeasureParam &param,
        float width,
        agenui::IPlatformLayoutBridge::MeasureMode widthMode,
        float height,
        agenui::IPlatformLayoutBridge::MeasureMode heightMode) override;
};

class A2UIChartMeasurement : public agenui::IPlatformLayoutBridge::IChartMeasurement {
public:
    A2UIChartMeasurement() = default;
    ~A2UIChartMeasurement() override = default;

    agenui::IPlatformLayoutBridge::MeasureSize measure(
        const agenui::IPlatformLayoutBridge::ChartMeasureParam &param,
        float width,
        agenui::IPlatformLayoutBridge::MeasureMode widthMode,
        float height,
        agenui::IPlatformLayoutBridge::MeasureMode heightMode) override;
};

class A2UIPlatformLayoutBridge : public agenui::IPlatformLayoutBridge {
public:
    A2UIPlatformLayoutBridge();
    ~A2UIPlatformLayoutBridge() override;

    ITextMeasurement* getTextMeasurement() override;
    IImgMeasurement* getImgMeasurement() override;
    ILottieMeasurement* getLottieMeasurement() override;
    IChartMeasurement* getChartMeasurement() override;

    int getDeviceWidth() override;
    int getDeviceHeight() override;
    DeviceOrientation getDeviceOrientation() override { return eOrientationuUknown; }
    float getDeviceDensity() override;

    void registerDeviceConfigChangeObserver(IDeviceConfigChangeObserver *observer) override;

    const char* getComponentStyles() override;

private:
    std::unique_ptr<A2UITextMeasurement> m_textMeasurement;
    std::unique_ptr<A2UIImgMeasurement> m_imgMeasurement;
    std::unique_ptr<A2UILottieMeasurement> m_lottieMeasurement;
    std::unique_ptr<A2UIChartMeasurement> m_chartMeasurement;
};

} // namespace a2ui
