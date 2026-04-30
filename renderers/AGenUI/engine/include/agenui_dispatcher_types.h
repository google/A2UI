#pragma once

#include <string>
#include <vector>
#include <map>
#include <unordered_map>

namespace agenui {

/**
 * @brief Generic component container (simplified using variant pattern)
 * @remark Can be dynamically resolved to a specific type based on the component field at runtime
 */
struct Component {
    std::string id;          // Component unique ID
    std::string type;        // Component type (e.g., "Text", "Button")
    std::string properties;  // Component-specific properties (JSON string)
};

/**
 * @brief CreateSurface message - Creates a new UI surface
 */
struct CreateSurfaceMessage {
    static const char* kVersion;  // "v0.9"
    
    std::string surfaceId;                   // Surface unique identifier
    std::string catalogId;                   // Component catalog identifier
    std::map<std::string, std::string> theme;  // Theme parameters (extensible map)
    bool sendDataModel = false;                // Whether to send back the data model
    bool animated = true;                      // Whether to enable animation
};

/**
 * @brief UpdateComponents message - Updates the component list
 */
struct UpdateComponentsMessage {
    static const char* kVersion;  // "v0.9"
    
    std::string surfaceId;                // Surface identifier
    std::vector<std::string> components;  // Component list (array of JSON strings)
};

/**
 * @brief DeleteSurface message - Deletes a surface
 */
struct DeleteSurfaceMessage {
    static const char* kVersion;  // "v0.9"
    
    std::string surfaceId;      // Surface identifier
};

/**
 * @brief Action message - User action event
 */
struct ActionMessage {
    static const char* kVersion;  // "v0.9"
    
    std::string surfaceId;                        // Surface identifier
    std::string sourceComponentId;                // Source component ID
    std::string contextJson;                      // Context data (JSON string)
};

/**
 * @brief Error message - Client error report
 */
struct ErrorMessage {
    static const char* kVersion;  // "v0.9"
    
    std::string code;      // Error code
    std::string surfaceId;  // Surface identifier
    std::string path;      // Error path (when validation fails)
    std::string message;   // Error description
};

/**
 * @brief SyncUIToData message - Syncs UI data to the data model
 */
struct SyncUIToDataMessage {
    static const char* kVersion;  // "v0.9"
    
    std::string surfaceId;      // Surface ID
    std::string componentId;    // Component ID
    std::string change;         // New value; contains changed fields, json
};

/**
 * @brief ComponentsUpdate message - Updates a component
 */
struct ComponentsUpdateMessage {
    static const char* kVersion;  // "v0.9"
    
    std::string componentId;  // Component ID
    std::string component;    // Component content (JSON string)
};

/**
 * @brief ComponentsAdd message - Adds a component
 */
struct ComponentsAddMessage {
    static const char* kVersion;  // "v0.9"
    
    std::string parentId;     // Parent component ID
    std::string componentId;  // New component ID
    std::string component;    // Component content (JSON string)
};

/**
 * @brief ComponentsRemove message - Removes a component
 */
struct ComponentsRemoveMessage {
    static const char* kVersion;  // "v0.9"
    
    std::string parentId;     // Parent component ID
    std::string componentId;  // Component ID to remove
};

}  // namespace agenui
