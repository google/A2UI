#pragma once

#include <map>
#include <string>
#include <vector>

namespace agenui {

/// Property value map: key -> value
using PropertyValueMap = std::map<std::string, std::string>;

/**
 * @brief Result of resolving an enum value
 * @remark Contains style overrides (e.g. "font-size" -> "96px")
 *         and property overrides (e.g. "text" -> "123")
 */
struct EnumResolution {
    PropertyValueMap styles;      ///< Style overrides
    PropertyValueMap properties;  ///< Property overrides
};

/// Enum value mapping: enum value -> EnumResolution
using EnumValueMapping = std::map<std::string, EnumResolution>;

/**
 * @brief Spec for a single property — mirrors the JSON structure per property
 */
struct PropertySpec {
    std::string defaultValue;          ///< Default value (JSON "default" field)
    EnumValueMapping enumMapping;      ///< Enum mapping (JSON "enum" field; empty if none)
};

/**
 * @brief Immutable property spec for a single component type
 * @remark Describes property defaults, style defaults, and enum mapping rules.
 *         Defined by JSON; immutable after construction.
 */
class ComponentPropertySpec {
public:
    /**
     * @brief Constructor
     * @param properties property spec map (property name -> PropertySpec)
     * @param defaultStyles default style map
     */
    ComponentPropertySpec(std::map<std::string, PropertySpec> properties,
                          PropertyValueMap defaultStyles);

    ~ComponentPropertySpec() = default;

    /**
     * @brief Get all property specs
     * @return const reference to the property spec map
     */
    const std::map<std::string, PropertySpec>& getProperties() const;

    /**
     * @brief Get default styles
     * @return const reference to the default style map
     */
    const PropertyValueMap& getDefaultStyles() const;

private:
    // Property specs: property name -> PropertySpec (default value + enum mapping)
    const std::map<std::string, PropertySpec> _properties;

    // Default styles: style property name -> style value
    const PropertyValueMap _defaultStyles;
};

}  // namespace agenui
