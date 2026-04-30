#include "agenui_ivirtual_define.h"
#include "layout/key_define.h"
#include "agenui_engine_context.h"

namespace agenui {

using namespace agenui;
#if defined(__OHOS__)

/**
 * Default CSS property values from Document.cpp::initDefaultCssValuesOnDocument:
 *   font-size        : value="28"           key=NODE_PROPERTY_FONT_SIZE
 *   font-weight      : value="normal"        key=NODE_PROPERTY_FONT_NORMAL
 *   font-style       : value="normal"        key=NODE_PROPERTY_FONT_NORMAL
 *   text-align       : value="left top"      key=TEXT_ALIGN_LEFT_TOP
 *   font-family      : value=""              key=NODE_PROPERTY_FONT_FAMILY
 *   letter-spacing   : value="0"             key=NODE_PROPERTY_LETTER_SPACING
 *   line-height      : value="1.0"           key=NODE_PROPERTY_LINE_HEIGHT
 *   line-clamp       : value=""              key=NODE_PROPERTY_LINE_CLAMP
 *   text-overflow    : value=""              key=NODE_PROPERTY_TEXT_OVERFLOW_UNDEFINED
 *   white-space      : value=""              key=NODE_PROPERTY_WHITE_SPACE
 */
const std::map<std::string, DefaultJsonProperties>& AGenUIVirtualDefine::getDefaultCssProperties() {
    static std::map<std::string, DefaultJsonProperties> kDefaultMap;
    if (kDefaultMap.empty()) {
        DefaultJsonProperties prop;

        prop.key = static_cast<int32_t>(NODE_PROPERTY_FONT_SIZE);             prop.value = "28";       kDefaultMap.insert(std::make_pair(std::string("font-size"),       prop));
        prop.key = static_cast<int32_t>(NODE_PROPERTY_FONT_NORMAL);           prop.value = "normal";   kDefaultMap.insert(std::make_pair(std::string("font-weight"),     prop));
        prop.key = static_cast<int32_t>(NODE_PROPERTY_FONT_NORMAL);           prop.value = "normal";   kDefaultMap.insert(std::make_pair(std::string("font-style"),      prop));
        prop.key = static_cast<int32_t>(TEXT_ALIGN_LEFT_TOP);                 prop.value = "left top"; kDefaultMap.insert(std::make_pair(std::string("text-align"),      prop));
        prop.key = static_cast<int32_t>(NODE_PROPERTY_FONT_FAMILY);           prop.value = "";         kDefaultMap.insert(std::make_pair(std::string("font-family"),     prop));
        prop.key = static_cast<int32_t>(NODE_PROPERTY_LETTER_SPACING);        prop.value = "1.5";        kDefaultMap.insert(std::make_pair(std::string("letter-spacing"),  prop));
        prop.key = static_cast<int32_t>(NODE_PROPERTY_LINE_HEIGHT);           prop.value = "1.0";      kDefaultMap.insert(std::make_pair(std::string("line-height"),     prop));
        prop.key = static_cast<int32_t>(NODE_PROPERTY_LINE_CLAMP);            prop.value = "";         kDefaultMap.insert(std::make_pair(std::string("line-clamp"),      prop));
        prop.key = static_cast<int32_t>(NODE_PROPERTY_TEXT_OVERFLOW_UNDEFINED); prop.value = "";       kDefaultMap.insert(std::make_pair(std::string("text-overflow"),   prop));
        prop.key = static_cast<int32_t>(NODE_PROPERTY_WHITE_SPACE);           prop.value = "";         kDefaultMap.insert(std::make_pair(std::string("white-space"),     prop));
    }
    return kDefaultMap;
}

std::string AGenUIVirtualDefine::getDefaultValue(const std::string& cssKey) {
    const std::map<std::string, DefaultJsonProperties>& m = getDefaultCssProperties();
    std::map<std::string, DefaultJsonProperties>::const_iterator it = m.find(cssKey);
    if (it != m.end()) {
        return it->second.value;
    }
    return "";
}

int32_t AGenUIVirtualDefine::getDefaultKey(const std::string& cssKey) {
    const std::map<std::string, DefaultJsonProperties>& m = getDefaultCssProperties();
    std::map<std::string, DefaultJsonProperties>::const_iterator it = m.find(cssKey);
    if (it != m.end()) {
        return it->second.key;
    }
    return 0;
}

IPlatformLayoutBridge* AGenUIVirtualDefine::getPlatformLayoutBridge() {
    return getEngineContext()->getPlatformLayoutBridge();
}

YGSize AGenUIVirtualDefine::getDeviceScreenSize() {
    IPlatformLayoutBridge* svc = getPlatformLayoutBridge();
    if (svc != nullptr) {
        YGSize size;
        size.width  = static_cast<float>(svc->getDeviceWidth());
        size.height = static_cast<float>(svc->getDeviceHeight());
        return size;
    }
    YGSize zero;
    zero.width  = 0;
    zero.height = 0;
    return zero;
}

float AGenUIVirtualDefine::getDeviceDensity() {
    static float sDensity = 0.0f;
    if (sDensity <= 0.0f) {
        IPlatformLayoutBridge* svc = getPlatformLayoutBridge();
        if (svc != nullptr) {
            sDensity = svc->getDeviceDensity();
        }
    }
    return (sDensity > 0.0f) ? sDensity : 1.0f;
}

float AGenUIVirtualDefine::convertPixelToDp(float pixel) {
    float density = getDeviceDensity();
    return static_cast<float>(PIXEL_TO_DP(pixel, density));
}

float AGenUIVirtualDefine::convertDpToPixel(float dp) {
    float density = getDeviceDensity();
    return static_cast<float>(DP_TO_PIXEL(dp, density));
}
#endif
} // namespace agenui
