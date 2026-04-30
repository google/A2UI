#include "agenui_component_property_spec_manager.h"
#include "agenui_component_spec_config.h"
#include "agenui_ispec_applicable.h"
#include "agenui_log.h"
#include "nlohmann/json.hpp"
#include <set>

namespace agenui {

// Parse component property specs from a JSON object; returns a (component type -> ComponentPropertySpec) map
static std::map<std::string, ComponentPropertySpec> parseComponentSpecs(const nlohmann::json& config) {
    std::map<std::string, ComponentPropertySpec> result;

    for (auto componentIt = config.begin(); componentIt != config.end(); ++componentIt) {
        const std::string& componentType = componentIt.key();
        const nlohmann::json& componentConfig = componentIt.value();

        if (!componentConfig.is_object()) {
            continue;
        }

        std::map<std::string, PropertySpec> properties;
        PropertyValueMap defaultStyles;

        // Iterate over each property of the component (e.g. "text", "variant", "styles")
        for (auto propIt = componentConfig.begin(); propIt != componentConfig.end(); ++propIt) {
            const std::string& propertyName = propIt.key();
            const nlohmann::json& propertyConfig = propIt.value();

            if (!propertyConfig.is_object()) {
                continue;
            }

            // Parse default value
            PropertySpec propSpec;
            if (propertyConfig.contains("default")) {
                const nlohmann::json& defaultValue = propertyConfig["default"];

                if (propertyName == "styles" && defaultValue.is_object()) {
                    // "styles" default is an object — parse it into the style defaults map
                    for (auto styleIt = defaultValue.begin(); styleIt != defaultValue.end(); ++styleIt) {
                        defaultStyles[styleIt.key()] = styleIt.value().dump();
                    }
                    continue;  // "styles" does not go into the properties map
                }

                propSpec.defaultValue = defaultValue.dump();
            }

            // Parse enum mapping
            if (propertyConfig.contains("enum") && propertyConfig["enum"].is_object()) {
                const nlohmann::json& enumConfig = propertyConfig["enum"];

                for (auto enumIt = enumConfig.begin(); enumIt != enumConfig.end(); ++enumIt) {
                    const std::string& enumValue = enumIt.key();
                    const nlohmann::json& enumObj = enumIt.value();

                    if (!enumObj.is_object()) {
                        continue;
                    }

                    EnumResolution resolution;

                    if (enumObj.contains("styles") && enumObj["styles"].is_object()) {
                        const nlohmann::json& stylesObj = enumObj["styles"];
                        for (auto styleIt = stylesObj.begin(); styleIt != stylesObj.end(); ++styleIt) {
                            resolution.styles[styleIt.key()] = styleIt.value().dump();
                        }
                    }

                    for (auto fieldIt = enumObj.begin(); fieldIt != enumObj.end(); ++fieldIt) {
                        if (fieldIt.key() == "styles") {
                            continue;
                        }
                        resolution.properties[fieldIt.key()] = fieldIt.value().dump();
                    }

                    propSpec.enumMapping[enumValue] = std::move(resolution);
                }
            }

            properties[propertyName] = std::move(propSpec);
        }

        result.emplace(componentType, ComponentPropertySpec(
            std::move(properties), std::move(defaultStyles)));
    }

    return result;
}

ComponentPropertySpecManager::ComponentPropertySpecManager() {
    initDefaultTheme();
}

ComponentPropertySpecManager::~ComponentPropertySpecManager() {
}

void ComponentPropertySpecManager::initDefaultTheme() {
    nlohmann::json baseConfig = nlohmann::json::parse(kBaseComponentSpecConfig, nullptr, false);
    if (baseConfig.is_discarded()) {
        AGENUI_LOG("[ComponentPropertySpecManager] initDefaultTheme failed: base config parse error");
        return;
    }

    _themedSpecs["default"] = parseComponentSpecs(baseConfig);
    AGENUI_LOG("[ComponentPropertySpecManager] initDefaultTheme: loaded %zu component specs",
               _themedSpecs["default"].size());
}

bool ComponentPropertySpecManager::loadFromString(const std::string& jsonString) {
    if (jsonString.empty()) {
        AGENUI_LOG("jsonString is empty");
        return false;
    }

    nlohmann::json jsonData = nlohmann::json::parse(jsonString, nullptr, false);
    if (jsonData.is_discarded()) {
        AGENUI_LOG("[ComponentPropertySpecManager] loadFromString failed: JSON parse error");
        return false;
    }

    if (!jsonData.is_object()) {
        AGENUI_LOG("root is not an object");
        return false;
    }

    // Parse the base config outside the lock (CPU-intensive)
    nlohmann::json baseConfig = nlohmann::json::parse(kBaseComponentSpecConfig, nullptr, false);
    if (baseConfig.is_discarded()) {
        AGENUI_LOG("[ComponentPropertySpecManager] loadFromString failed: base config parse error");
        return false;
    }

    // Pre-parse all theme data outside the lock to minimize lock hold time
    std::map<std::string, std::map<std::string, ComponentPropertySpec>> parsedThemes;
    size_t themeCount = 0;

    for (auto themeIt = jsonData.begin(); themeIt != jsonData.end(); ++themeIt) {
        const std::string& theme = themeIt.key();
        const nlohmann::json& themeConfig = themeIt.value();

        if (!themeConfig.is_object()) {
            AGENUI_LOG("theme config is not an object, theme:%s", theme.c_str());
            continue;
        }

        nlohmann::json mergedConfig = baseConfig;
        mergedConfig.merge_patch(themeConfig);

        parsedThemes[theme] = parseComponentSpecs(mergedConfig);

        AGENUI_LOG("[ComponentPropertySpecManager] loadFromString: loaded %zu component specs for theme=%s",
                   parsedThemes[theme].size(), theme.c_str());
        themeCount++;
    }

    // Write under lock
    {
        std::lock_guard<std::mutex> lock(_mutex);
        for (auto& pair : parsedThemes) {
            _themedSpecs[pair.first] = std::move(pair.second);
        }
    }

    AGENUI_LOG("loaded %zu themes", themeCount);
    return true;
}

void ComponentPropertySpecManager::applySpec(const std::string& theme, ISpecApplicable* component) const {
    if (!component) {
        AGENUI_LOG("[ComponentPropertySpecManager] applySpec failed: component is null");
        return;
    }

    std::lock_guard<std::mutex> lock(_mutex);

    const std::string& effectiveTheme = theme.empty() ? std::string("default") : theme;
    auto themeIt = _themedSpecs.find(effectiveTheme);
    if (themeIt == _themedSpecs.end()) {
        themeIt = _themedSpecs.find("default");
        if (themeIt == _themedSpecs.end()) {
            return;
        }
    }

    const std::string componentType = component->getComponentType();
    auto it = themeIt->second.find(componentType);
    if (it == themeIt->second.end()) {
        return;
    }

    const ComponentPropertySpec& spec = it->second;

    // Step 1: fill in missing property defaults 
    // For each property in the spec, write the default value only if the component
    // does not already have that property. Track which properties were filled here
    // so Step 2 can distinguish pre-existing values from defaults.
    std::set<std::string> defaultFilledProperties;
    for (const auto& pair : spec.getProperties()) {
        if (!component->hasProperty(pair.first)) {
            component->setPropertyValue(pair.first, pair.second.defaultValue);
            defaultFilledProperties.insert(pair.first);
        }
    }

    // Step 2: enum mapping resolution (non-cascading) 
    // Collect all enum resolution results based on the component state after Step 1,
    // then apply them in one pass. Resolutions do not cascade: resolving property A
    // does not trigger re-resolution of property B.
    PropertyValueMap pendingProperties;
    PropertyValueMap pendingStyles;

    for (const auto& pair : spec.getProperties()) {
        const PropertySpec& propSpec = pair.second;
        if (propSpec.enumMapping.empty()) {
            continue;
        }

        // Read the current value (either pre-existing or filled in during Step 1)
        const std::string currentValue = component->getPropertyStringValue(pair.first);
        auto enumIt = propSpec.enumMapping.find(currentValue);
        if (enumIt == propSpec.enumMapping.end()) {
            continue;
        }

        const EnumResolution& resolution = enumIt->second;
        for (const auto& stylePair : resolution.styles) {
            pendingStyles[stylePair.first] = stylePair.second;
        }
        for (const auto& propPair : resolution.properties) {
            pendingProperties[propPair.first] = propPair.second;
        }
    }

    // Apply enum resolution results:
    // - Skip properties that existed before applySpec (they have highest priority)
    // - May overwrite properties that were filled with defaults in Step 1
    for (const auto& pair : pendingProperties) {
        if (component->hasProperty(pair.first) && defaultFilledProperties.count(pair.first) == 0) {
            continue;
        }
        component->setPropertyValue(pair.first, pair.second);
    }
    for (const auto& pair : pendingStyles) {
        if (component->hasStyle(pair.first)) {
            continue;
        }
        component->setStyleValue(pair.first, pair.second);
    }

    // Step 3: fill in missing style defaults 
    // Pre-existing styles and styles set by enum mapping are not overwritten
    for (const auto& pair : spec.getDefaultStyles()) {
        if (!component->hasStyle(pair.first)) {
            component->setStyleValue(pair.first, pair.second);
        }
    }
}

}  // namespace agenui
