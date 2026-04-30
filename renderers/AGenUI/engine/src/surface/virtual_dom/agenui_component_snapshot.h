#pragma once

#include <memory>
#include <string>
#include <vector>
#include <map>
#include "surface/agenui_serializable_data.h"

//#define TEST_COMPONENT_UPDATE

namespace agenui {

/**
 * @brief Layout info structure
 * @remark Stores the layout results computed by Yoga
 */
struct LayoutInfo {
    float x = 0.0f;        // X position
    float y = 0.0f;        // Y position
    float width = 0.0f;    // Width
    float height = 0.0f;   // Height
    int lines = 0;         // Number of text lines (valid for text components)
    std::string styleInfo; // Saved width/height style info from snapshot.styles (JSON format)

    /**
     * @brief Check whether the layout info is valid
     * @return false if all values are 0, true otherwise
     */
    bool isValid() const {
        return width > 0.0f || height > 0.0f;
    }

    bool operator==(const LayoutInfo& other) const;
    bool operator!=(const LayoutInfo& other) const;
};

/**
 * @brief Component data binding status enum
 * @remark Indicates the binding state between the component and its data sources
 */
enum class DataBindingStatus {
    /** @brief No data dependency; the component requires no data binding */
    NotDependent,
    /** @brief Data is not ready at all; none of the bound data sources have resolved */
    NotReady,
    /** @brief Data is partially ready; some bound data sources have resolved */
    PartiallyReady,
    /** @brief Data is fully ready; all bound data sources have resolved */
    FullyReady
};

/**
 * @brief Component display rule enum
 * @remark Specifies when the component should be rendered
 */
enum class DisplayRule {
    /** @brief Always render, regardless of data binding status */
    Always,
    /** @brief Render as soon as any data (including children) is ready */
    AnyDataReady,
    /** @brief Render only when all data (including children) is ready */
    AllDataReady
};

/**
 * @brief Component snapshot structure
 * @remark Passed to the event dispatch layer to convey the component state at a specific moment
 */
struct ComponentSnapshot {
    std::string id;                               // Component ID
    std::string rawId;                            // Raw component ID
    std::string component;                        // Component type
    std::vector<std::string> children;            // Child component list

    /**
     * @brief Component attribute map
     *
     * Stores all component attributes:
     * - key: attribute name (e.g. "text", "src", "onClick")
     * - value: attribute value as a JSON-format string
     *
     * @note Values are stored in JSON format so the type is unambiguous,
     *       complex types (objects, arrays, nested structures) are supported,
     *       and stringify() can reconstruct them correctly.
     *
     * @example Storage format (C++ representation):
     * attributes["text"] = "\"Hello World\"";       // string: stringify() restores "Hello World"
     * attributes["count"] = "42";                    // number: stringify() restores 42
     * attributes["visible"] = "true";                // bool:   stringify() restores true
     * attributes["items"] = "[\"item1\",\"item2\"]"; // array:  stringify() restores ["item1","item2"]
     * attributes["config"] = "{\"key\":\"value\"}";  // object: stringify() restores {"key":"value"}
     *
     * @see A2UIAttributeConverter converts A2UI attributes (justify, align, etc.) to Yoga layout properties
     * @see ComponentSnapshot::stringify() uses nlohmann::json::parse() to restore these JSON strings
     */
    std::map<std::string, SerializableData> attributes;

    /**
     * @brief Component style map
     *
     * Stores all component style properties:
     * - key: style property name (e.g. "width", "height", "backgroundColor")
     * - value: style value as a JSON-format string
     *
     * @note Values are stored in JSON format for the same reasons as the attributes map.
     *
     * @example Storage format (C++ representation):
     * styles["width"] = "\"100px\"";              // string: stringify() restores "100px"
     * styles["height"] = "200";                    // number: stringify() restores 200
     * styles["backgroundColor"] = "\"#FF0000\"";  // string: stringify() restores "#FF0000"
     * styles["margin"] = "\"10px 20px\"";         // string: stringify() restores "10px 20px"
     * styles["flex-direction"] = "\"row\"";       // string: stringify() restores "row"
     *
     * @see CSSStyleConverter converts CSS style properties to Yoga layout properties
     * @see ComponentSnapshot::stringify() uses nlohmann::json::parse() to restore these JSON strings
     */
    std::map<std::string, SerializableData> styles;

    LayoutInfo layout;                            // Layout info
    DataBindingStatus dataBindingStatus = DataBindingStatus::NotDependent;  // Data binding status
    DisplayRule displayRule = DisplayRule::Always;  // Display rule

    /**
     * @brief Serialize the component snapshot to a JSON string
     * @return JSON string
     */
    std::string stringify() const;
    bool appendMode = false;

    void resetMode();
};

}  // namespace agenui
