#pragma once

#include <map>
#include <string>
#include <stdint.h>
#if defined(__OHOS__)
#include "yoga/YGEnums.h"
#include "yoga/Yoga.h"
#endif
#include "agenui_platform_layout_bridge.h"

#define PIXEL_TO_DP(value, density) ((value) / density * 2.0)
#define DP_TO_PIXEL(value, density)  ((value) / 2.0 * density)

namespace agenui {
#if defined(__OHOS__)
/**
 * @brief Descriptor structure for CSS property default values
 *
 * key  = corresponding NODE_PROPERTY_* enum value
 * value = corresponding string default value
 */
struct DefaultJsonProperties {
    int32_t key;
    std::string value;
};

/**
 * @brief Virtual DOM default CSS property value definitions
 *
 * Corresponds to default values from initDefaultCssValuesOnDocument in Document.cpp.
 * Stored as std::map<std::string, DefaultJsonProperties>:
 *   map key   = CSS property name string (e.g. "font-size")
 *   map value = DefaultJsonProperties:
 *               .key   = NODE_PROPERTY_* enum value
 *               .value = string default value (e.g. "28")
 */
class AGenUIVirtualDefine {
public:
    /**
     * @brief Get the default CSS property map
     * @return key: CSS property name string, value: DefaultJsonProperties
     */
    static const std::map<std::string, DefaultJsonProperties>& getDefaultCssProperties();

    /**
     * @brief Get the string default value for a CSS property name
     * @param cssKey CSS property name (e.g. "font-size")
     * @return Default string value, or empty string if not found
     */
    static std::string getDefaultValue(const std::string& cssKey);

    /**
     * @brief Get the default NODE_PROPERTY_* enum key for a CSS property name
     * @param cssKey CSS property name (e.g. "font-weight")
     * @return NODE_PROPERTY_* enum value, or 0 if not found
     */
    static int32_t getDefaultKey(const std::string& cssKey);

    /**
     * @brief Get the global IPlatformLayoutBridge (from IEngineContext)
     * @return IPlatformLayoutBridge pointer, or nullptr if not set
     */
    static IPlatformLayoutBridge* getPlatformLayoutBridge();

    /**
     * @brief Get the device screen size wrapped as YGSize
     * @return YGSize.width = getDeviceWidth(), YGSize.height = getDeviceHeight();
     *         returns {0, 0} if unavailable
     */
    static YGSize getDeviceScreenSize();

    /**
     * @brief Get the raw device pixel density, cached in a static variable after first call
     * @return Raw getDeviceDensity() value, or 1.0f if unavailable
     */
    static float getDeviceDensity();

    /**
     * @brief Convert a pixel value to dp
     * @param pixel Pixel value
     * @return dp value; returns pixel unchanged if density is invalid
     */
    static float convertPixelToDp(float pixel);

    /**
     * @brief Convert a dp value to pixels
     * @param dp dp value
     * @return Pixel value; returns dp unchanged if density is invalid
     */
    static float convertDpToPixel(float dp);
};

#endif
} // namespace agenui
