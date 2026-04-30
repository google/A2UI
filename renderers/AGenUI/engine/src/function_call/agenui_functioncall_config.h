#pragma once

#include <string>
#include "nlohmann/json.hpp"

namespace agenui {

/**
 * @brief FunctionCall configuration class
 *
 * Stores functionCall metadata including namespace, name, description, and parameter schema.
 * Example FunctionCallConfig for ToastFunctionCall:
 *  {
     "namespace": "agenui.platform",
     "name": "toast",
     "description": "Show a Toast message",
     "returnType": "object",
     "parameters": {
       "type": "object",
       "properties": {
         "value": {
           "type": "string",
           "description": "Message content to display"
         },
         "duration": {
           "type": "string",
           "description": "Display duration",
           "default": "short",
           "enum": [
             "short",
             "long"
           ]
         }
       },
       "required": [
         "value"
       ]
     },
     "sync": true
    }
 * The "parameters" field is a JSON Schema used to validate functionCall arguments.
 * Android example of configuring Toast:
     JSONObject parameters = new JSONObject();
     parameters.put("type", "object");

     JSONObject properties = new JSONObject();

     JSONObject valueParam = new JSONObject();
     valueParam.put("type", "string");
     valueParam.put("description", "Message content to display");
     properties.put("value", valueParam);

     JSONObject durationParam = new JSONObject();
     durationParam.put("type", "string");
     durationParam.put("description", "Display duration");
     durationParam.put("default", "short");
     durationParam.put("enum", new org.json.JSONArray().put("short").put("long"));
     properties.put("duration", durationParam);

     parameters.put("properties", properties);
     parameters.put("required", new org.json.JSONArray().put("value"));

     functionCallConfig.setParameters(parameters);
 */
class FunctionCallConfig {
public:
    FunctionCallConfig();
    ~FunctionCallConfig();
    
    /**
     * @brief Create a FunctionCallConfig from a JSON object
     * @param json JSON object
     * @return FunctionCallConfig instance
     */
    static FunctionCallConfig fromJson(const nlohmann::json& json);

    /**
     * @brief Serialize to a JSON object
     * @return JSON object
     */
    nlohmann::json toJson() const;

    /**
     * @brief Check whether the configuration is valid
     * @return true if valid, false otherwise
     */
    bool isValid() const;

    /**
     * @brief Get the fully qualified functionCall name (namespace::name)
     * @return Full name
     */
    std::string getFullName() const;

    // Getters
    const std::string& getNamespace() const { return _namespace; }
    const std::string& getName() const { return _name; }
    const std::string& getDescription() const { return _description; }
    const std::string& getReturnType() const { return _returnType; }
    const nlohmann::json& getParameters() const { return _parameters; }
    bool isSync() const { return _sync; }

    // Setters
    void setNamespace(const std::string& ns) { _namespace = ns; }
    void setName(const std::string& name) { _name = name; }
    void setDescription(const std::string& desc) { _description = desc; }
    void setReturnType(const std::string& type) { _returnType = type; }
    void setParameters(const nlohmann::json& params) { _parameters = params; }
    void setSync(bool sync) { _sync = sync; }

private:
    std::string _namespace;      // FunctionCall namespace
    std::string _name;           // FunctionCall name
    std::string _description;    // FunctionCall description
    std::string _returnType;     // Return type
    nlohmann::json _parameters;  // Parameter schema (JSON Schema) for argument validation
    bool _sync;                  // Whether execution is synchronous
};

} // namespace agenui
