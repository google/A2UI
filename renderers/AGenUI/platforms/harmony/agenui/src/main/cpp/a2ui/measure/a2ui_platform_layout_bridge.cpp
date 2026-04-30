#include "a2ui_platform_layout_bridge.h"
#include "log/a2ui_capi_log.h"
#include "hm_text_measure_utils.h"
#include "a2ui/utils/a2ui_unit_utils.h"
#include "nlohmann/json.hpp"
#include <algorithm>

// Global density must stay outside the namespace to match the extern declaration.
float gDensityForUI = 3.0f;

namespace a2ui {

// Cached device metrics. Defaults match the original hard-coded values.
static int s_deviceWidth = 300;
static int s_deviceHeight = 500;
static float s_deviceDensity = 3.375f;
static bool s_hasImageFadeInOverride = false;
static bool s_imageFadeInEnabled = true;
static constexpr int32_t kDefaultImageFadeInDurationMs = 1500;

static const char* g_component_styles = R"JSON({
  "Tabs": {
    "tab-mode": "fixed",
    "indicator-color": "#2273F7",
    "indicator-width": "48px",
    "indicator-height": "8px",
    "indicator-radius": "4px",
    "tab-font-size": "32px",
    "tab-font-size-selected": "32px",
    "tab-font-color": "#000000",
    "tab-font-color-selected": "#2273F7",
    "tab-font-weight": "normal",
    "tab-font-weight-selected": "bold"
  },
  "Modal": {
    "show-close-button": "false",
    "close-button-margin": "16px",
    "close-button-size": "72px",
    "overlay-color": "#00000080"
  },
  "Button": {
    "disabled-opacity": "0.4"
  },
  "Image": {
    "fade-in-enabled": true,
    "fade-in-duration": 1500
  },
  "CheckBox": {
    "checkbox-size": "32px",
    "checkbox-background-color-selected": "#2E82FF",
    "checkbox-border-color-selected": "#2E82FF",
    "checkbox-background-color": "#00000000",
    "checkbox-border-color": "#0000001A",
    "checkbox-background-color-disabled": "#EBEBEB",
    "checkbox-border-color-disabled": "#0000001A",
    "checkbox-border-width": "3px",
    "checkbox-border-radius": "12px",
    "text-margin": "16px",
    "text-color": "#000000",
    "text-color-disabled": "#66000000",
    "text-size": "32px"
  },
  "ChoicePicker": {
    "checkbox-size": "32px",
    "checkbox-background-color-selected": "#2E82FF",
    "checkbox-border-color-selected": "#2E82FF",
    "checkbox-background-color": "#00000000",
    "checkbox-border-color": "#0000001A",
    "checkbox-border-width": "3px",
    "checkbox-border-radius": "12px",
    "text-margin": "16px",
    "text-color": "#000000",
    "text-size": "32px",
    "choice-gap": "40px"
  },
  "Slider": {
    "slider-height": "48px",
    "track-height": "4px",
    "track-corner-radius": "2px",
    "minimum-track-color": "#1A66FF",
    "maximum-track-color": "#EEF0F4",
    "thumb-outer-diameter": "48px",
    "thumb-outer-color": "#FFFFFF",
    "thumb-inner-diameter": "16px",
    "thumb-inner-color": "#1A66FF"
  },
  "AudioPlayer": {
    "size": "80px",
    "play-icon-size": "40px",
    "pause-icon-size": "35px",
    "ring-width": "8px",
    "play-bg-color": "#2273F7",
    "pause-bg-color": "#FFFFFF",
    "ring-color": "#2273F7",
    "play-icon-color": "#FFFFFF",
    "pause-icon-color": "#2273F7",
    "loading-color": "#2273F7",
    "error-bg-color": "#CCCCCC"
  },
  "DateTimeInput": {
    "compact": {
      "height": "56px",
      "font-size": "24px",
      "icon-name": "event",
      "icon-size": "24px",
      "icon-spacing": "6px",
      "selected-background-color": "#2273F714",
      "selected-text-color": "#2273F7",
      "unselected-text-color": "#000000",
      "placeholder-text": "Select Data",
      "padding-vertical": "12px",
      "padding-horizontal": "24px",
      "corner-radius": "8px",
      "popup-mask-color": "#00000066",
      "popup-corner-radius": "12px"
    },
    "wheels-2col": {
      "font-size": "28px",
      "row-spacing": "80px",
      "selected-color": "#000000",
      "unselected-color": "#33000000",
      "selected-background-color": "#FFFFFF",
      "picker-height": "368px",
      "divider-color": "#0F000000",
      "divider-height": "2px",
      "background-color": "#FFFFFF",
      "container-padding": "16px"
    },
    "wheels-3col": {
      "font-size": "36px",
      "row-spacing": "80px",
      "selected-color": "#000000",
      "unselected-color": "#33000000",
      "selected-background-color": "#FFFFFF",
      "picker-height": "428px",
      "divider-color": "#0F000000",
      "divider-height": "2px",
      "background-color": "#FFFFFF",
      "container-padding": "40px"
    },
    "wheels-5col": {
      "font-size": "28px",
      "row-spacing": "80px",
      "selected-color": "#000000",
      "unselected-color": "#33000000",
      "selected-background-color": "#FFFFFF",
      "picker-height": "368px",
      "divider-color": "#0F000000",
      "divider-height": "2px",
      "background-color": "#FFFFFF",
      "container-padding": "15px"
    }
  },
  "Carousel": {
    "indicator-dot-spacing": "8px",
    "indicator-inactive-dot-width": "6px",
    "indicator-active-dot-width": "24px",
    "indicator-container-height": "6px",
    "indicator-bottom-offset": "12px",
    "indicator-background-color": "#00000000",
    "indicator-active-dot-color": "#00000099",
    "indicator-inactive-dot-color": "#0000001a",
    "indicator-active-corner-radius": "3px",
    "image-placeholder-color": "#F2F2F7"
  },
  "Table": {
    "header-bg-color": "#EEEFF2",
    "header-font-color": "#000000",
    "header-font-size": "28px",
    "header-font-weight": "bold",
    "body-bg-color": [
      "#FFFFFF",
      "#F6F7F8"
    ],
    "body-font-color": "#000000",
    "body-font-size": "28px",
    "body-font-weight": "normal",
    "text-align": "left",
    "vertical-align": "center",
    "min-column-width": "100px",
    "max-column-width": "600px",
    "cell-padding-vertical":"20px",
    "cell-padding-horizontal":"32px",
    "horizontal-scroll": "true"
  }
})JSON";

// Static variable used to cache the parsed JSON object
static nlohmann::json s_parsedComponentStyles;
static bool s_stylesInitialized = false;

// Parse component styles once on first use.
static void initializeComponentStyles() {
    if (!s_stylesInitialized) {
        try {
            s_parsedComponentStyles = nlohmann::json::parse(g_component_styles);
            s_stylesInitialized = true;
            HM_LOGD("Component styles initialized successfully");
        } catch (const nlohmann::json::exception& e) {
            HM_LOGE("initializeComponentStyles - Failed to parse component styles: %s", e.what());
            s_parsedComponentStyles = nlohmann::json::object();
            s_stylesInitialized = true; // Avoid retry loops after a parse failure.
        }
    }
}

void setDeviceInfo(int width, int height, float density) {
    s_deviceWidth = width;
    s_deviceHeight = height;
    s_deviceDensity = density;
    gDensityForUI  = density;
    HM_LOGD("setDeviceInfo: width=%d, height=%d, density=%.3f", width, height, density);
}

float getScreenDensity() {
    return s_deviceDensity;
}

nlohmann::json getComponentStylesFor(const std::string& componentName) {
    // Initialize the style cache on demand.
    initializeComponentStyles();

    // Read component styles from the cached JSON object.
    if (s_parsedComponentStyles.contains(componentName) && s_parsedComponentStyles[componentName].is_object()) {
        return s_parsedComponentStyles[componentName];
    }

    return nlohmann::json::object();
}

void setImageFadeInEnabled(bool enabled) {
    s_hasImageFadeInOverride = true;
    s_imageFadeInEnabled = enabled;
    HM_LOGI("setImageFadeInEnabled: enabled=%s", enabled ? "true" : "false");
}

bool isImageFadeInEnabled() {
    if (s_hasImageFadeInOverride) {
        return s_imageFadeInEnabled;
    }

    const nlohmann::json imageStyles = getComponentStylesFor("Image");
    if (imageStyles.is_object() && imageStyles.contains("fade-in-enabled")) {
        const nlohmann::json& value = imageStyles["fade-in-enabled"];
        if (value.is_boolean()) {
            return value.get<bool>();
        }
        if (value.is_number_integer()) {
            return value.get<int>() != 0;
        }
        if (value.is_string()) {
            const std::string flag = value.get<std::string>();
            if (flag == "true" || flag == "1") {
                return true;
            }
            if (flag == "false" || flag == "0") {
                return false;
            }
        }
    }
    return s_imageFadeInEnabled;
}

int32_t getImageFadeInDurationMs() {
    const nlohmann::json imageStyles = getComponentStylesFor("Image");
    if (imageStyles.is_object() && imageStyles.contains("fade-in-duration")) {
        const nlohmann::json& value = imageStyles["fade-in-duration"];
        try {
            if (value.is_number_integer()) {
                return std::max(0, value.get<int32_t>());
            }
            if (value.is_number()) {
                return std::max(0, static_cast<int32_t>(value.get<float>()));
            }
            if (value.is_string()) {
                return std::max(0, std::stoi(value.get<std::string>()));
            }
        } catch (...) {
            HM_LOGW("getImageFadeInDurationMs: invalid duration config");
        }
    }
    return kDefaultImageFadeInDurationMs;
}

A2UIPlatformLayoutBridge::A2UIPlatformLayoutBridge() {
    HM_LOGD("A2UIPlatformLayoutBridge created");
}

A2UIPlatformLayoutBridge::~A2UIPlatformLayoutBridge() {
    HM_LOGD("A2UIPlatformLayoutBridge destroyed");
}

agenui::IPlatformLayoutBridge::MeasureSize A2UITextMeasurement::measure(
    const agenui::IPlatformLayoutBridge::TextMeasureParam &param,
    float width,
    agenui::IPlatformLayoutBridge::MeasureMode widthMode,
    float height,
    agenui::IPlatformLayoutBridge::MeasureMode heightMode)
{
    float baseLine = 0.f, ascent = 0.f, descent = 0.f;
    agenui::IPlatformLayoutBridge::MeasureSize result = TextMeasureUtils::doMeasure(param, width, widthMode, height, heightMode, baseLine, ascent, descent);
    return result;
}

float A2UITextMeasurement::getBaselineOfFirstLine(
    const agenui::IPlatformLayoutBridge::TextMeasureParam &param,
    float width,
    agenui::IPlatformLayoutBridge::MeasureMode widthMode,
    float height,
    agenui::IPlatformLayoutBridge::MeasureMode heightMode)
{
    float baseLine = 0.f, ascent = 0.f, descent = 0.f;
    TextMeasureUtils::doMeasure(param, width, widthMode, height, heightMode, baseLine, ascent, descent);
    return baseLine;
}

// A2UIImgMeasurement implementation
agenui::IPlatformLayoutBridge::MeasureSize A2UIImgMeasurement::measure(
    const agenui::IPlatformLayoutBridge::ImgMeasureParam &param,
    float width,
    agenui::IPlatformLayoutBridge::MeasureMode widthMode,
    float height,
    agenui::IPlatformLayoutBridge::MeasureMode heightMode) {
    agenui::IPlatformLayoutBridge::MeasureSize size;
    size.lines = 0;
    size.width = width;
    size.height = height;
    return size;
}

// A2UILottieMeasurement implementation
agenui::IPlatformLayoutBridge::MeasureSize A2UILottieMeasurement::measure(
    const agenui::IPlatformLayoutBridge::LottieMeasureParam &param,
    float width,
    agenui::IPlatformLayoutBridge::MeasureMode widthMode,
    float height,
    agenui::IPlatformLayoutBridge::MeasureMode heightMode)
{
    agenui::IPlatformLayoutBridge::MeasureSize size;
    size.lines = 0;
    size.width = 350.0f;
    size.height = 350.0f;

    HM_LOGD("url:%s, Final size: %.1fx%.1f (widthMode=%d, heightMode=%d)",
            param.url ? param.url : "null", size.width, size.height, widthMode, heightMode);

    return size;
}

// A2UIChartMeasurement implementation
agenui::IPlatformLayoutBridge::MeasureSize A2UIChartMeasurement::measure(
    const agenui::IPlatformLayoutBridge::ChartMeasureParam &param,
    float width,
    agenui::IPlatformLayoutBridge::MeasureMode widthMode,
    float height,
    agenui::IPlatformLayoutBridge::MeasureMode heightMode)
{
    agenui::IPlatformLayoutBridge::MeasureSize size;
    size.lines = 0;

    // Choose a default size from the chart type.
    if (param.type && std::string(param.type) == "donut") {
        size.width = 300.0f;
        size.height = 300.0f;
    } else if (param.type && std::string(param.type) == "line") {
        size.width = 400.0f;
        size.height = 250.0f;
    } else if (param.type && std::string(param.type) == "bar") {
        size.width = 400.0f;
        size.height = 300.0f;
    } else {
        size.width = 350.0f;
        size.height = 300.0f;
    }

    // Shrink to fit when a width constraint is available.
    if (widthMode == agenui::IPlatformLayoutBridge::MeasureModeAtMost && width > 0) {
        if (width < size.width) {
            float aspectRatio = size.height / size.width;
            size.width = width;
            size.height = width * aspectRatio;
        }
    }

    HM_LOGD("type:%s, data:%s, Final size: %.1fx%.1f (widthMode=%d, heightMode=%d)",
            param.type ? param.type : "null", param.data ? param.data : "null", size.width, size.height, widthMode, heightMode);

    return size;
}

// A2UIPlatformLayoutBridge implementation
agenui::IPlatformLayoutBridge::ITextMeasurement* A2UIPlatformLayoutBridge::getTextMeasurement() {
    if (!m_textMeasurement) {
        m_textMeasurement = std::make_unique<A2UITextMeasurement>();
    }
    return m_textMeasurement.get();
}

agenui::IPlatformLayoutBridge::IImgMeasurement* A2UIPlatformLayoutBridge::getImgMeasurement() {
    if (!m_imgMeasurement) {
        m_imgMeasurement = std::make_unique<A2UIImgMeasurement>();
    }
    return m_imgMeasurement.get();
}

agenui::IPlatformLayoutBridge::ILottieMeasurement* A2UIPlatformLayoutBridge::getLottieMeasurement() {
    if (!m_lottieMeasurement) {
        m_lottieMeasurement = std::make_unique<A2UILottieMeasurement>();
    }
    return m_lottieMeasurement.get();
}

agenui::IPlatformLayoutBridge::IChartMeasurement* A2UIPlatformLayoutBridge::getChartMeasurement() {
    if (!m_chartMeasurement) {
        m_chartMeasurement = std::make_unique<A2UIChartMeasurement>();
    }
    return m_chartMeasurement.get();
}

void A2UIPlatformLayoutBridge::registerDeviceConfigChangeObserver(
    agenui::IPlatformLayoutBridge::IDeviceConfigChangeObserver *observer) {
}

int A2UIPlatformLayoutBridge::getDeviceWidth() {
    return static_cast<int>(UnitConverter::pxToA2ui(s_deviceWidth));
}

int A2UIPlatformLayoutBridge::getDeviceHeight() {
    return static_cast<int>(UnitConverter::pxToA2ui(s_deviceHeight));
}

float A2UIPlatformLayoutBridge::getDeviceDensity() {
    return s_deviceDensity;
}

const char* A2UIPlatformLayoutBridge::getComponentStyles() {
    return g_component_styles;
}

} // namespace a2ui
