#include "a2ui_log_utils.h"
#include "log/a2ui_capi_log.h"

#include <cstdio>
#include <string>

#include <nlohmann/json.hpp>

namespace agenui {

std::string A2UILogUtils::formatNumber(double value) {
    char buffer[32];
    snprintf(buffer, sizeof(buffer), "%.0f", value);
    return std::string(buffer);
}

std::string A2UILogUtils::formatComponentBrief(const std::string& componentJson) {
#if defined(APP_BUILD_TYPE_TEST) || defined(APP_BUILD_TYPE_INSPECT) || defined(APP_BUILD_TYPE_ASAN)    
    try {
        auto json = nlohmann::json::parse(componentJson);
        std::string componentType = json.value("component", "");
        std::string id = json.value("id", "");
        double x = 0.0;
        double y = 0.0;
        double width = 0.0;
        double height = 0.0;
        if (json.contains("styles") && json["styles"].is_object()) {
            const auto& styles = json["styles"];
            x = styles.value("x", 0.0);
            y = styles.value("y", 0.0);
            width = styles.value("width", 0.0);
            height = styles.value("height", 0.0);
        }
        return "component:" + componentType +
               ", id:" + id +
               ", x:" + formatNumber(x) +
               ", y:" + formatNumber(y) +
               ", w:" + formatNumber(width) +
               ", h:" + formatNumber(height) +
               ", raw:" + componentJson;
        return "raw:" + componentJson;
    } catch (...) {
        HM_LOGW("formatComponentJson: parse failed, returning raw payload");
        return "raw:" + componentJson;
    }
#else
    return "raw:" + componentJson; 
#endif    
}

} // namespace agenui
