#pragma once

#include <string>

namespace agenui {

/**
 * @brief Interface for components that can have a property spec applied to them
 * @remark Implement this interface to allow ComponentPropertySpecManager to fill in
 *         default property values and resolve enum mappings. ComponentModel should implement this.
 */
class ISpecApplicable {
public:
    virtual ~ISpecApplicable() = default;

    /**
     * @brief Get the component type (e.g. "Text", "Button")
     */
    virtual std::string getComponentType() const = 0;

    /**
     * @brief Check whether a property is already set
     * @param propertyName property name
     * @return true if set, false otherwise
     */
    virtual bool hasProperty(const std::string& propertyName) const = 0;

    /**
     * @brief Get a property value as a string
     * @param propertyName property name
     * @return property value, or empty string if not set
     */
    virtual std::string getPropertyStringValue(const std::string& propertyName) const = 0;

    /**
     * @brief Set a property value
     * @param propertyName property name
     * @param value property value
     */
    virtual void setPropertyValue(const std::string& propertyName, const std::string& value) = 0;

    /**
     * @brief Check whether a style is already set
     * @param styleName style property name
     * @return true if set, false otherwise
     */
    virtual bool hasStyle(const std::string& styleName) const = 0;

    /**
     * @brief Set a style value
     * @param styleName style property name
     * @param value style value
     */
    virtual void setStyleValue(const std::string& styleName, const std::string& value) = 0;
};

}  // namespace agenui
