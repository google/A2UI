#include "agenui_functioncall_config.h"

namespace agenui {

FunctionCallConfig::FunctionCallConfig() : _sync(true) {
}

FunctionCallConfig::~FunctionCallConfig() {
}

FunctionCallConfig FunctionCallConfig::fromJson(const nlohmann::json& json) {
    FunctionCallConfig config;
    
    if (json.contains("namespace") && json["namespace"].is_string()) {
        config._namespace = json["namespace"].get<std::string>();
    }
    
    if (json.contains("name") && json["name"].is_string()) {
        config._name = json["name"].get<std::string>();
    }
    
    if (json.contains("description") && json["description"].is_string()) {
        config._description = json["description"].get<std::string>();
    }
    
    if (json.contains("returnType") && json["returnType"].is_string()) {
        config._returnType = json["returnType"].get<std::string>();
    }
    
    if (json.contains("parameters")) {
        const nlohmann::json& parameters = json["parameters"];
        if (parameters.is_object() || parameters.is_null()) {
            config._parameters = parameters;
        } else {
            // Non-object/non-null parameters are invalid; reset to null so the validator skips validation
            config._parameters = nlohmann::json(nullptr);
        }
    }
    
    if (json.contains("sync") && json["sync"].is_boolean()) {
        config._sync = json["sync"].get<bool>();
    }
    
    return config;
}

nlohmann::json FunctionCallConfig::toJson() const {
    nlohmann::json json;
    
    if (!_namespace.empty()) {
        json["namespace"] = _namespace;
    }
    
    json["name"] = _name;
    json["description"] = _description;
    json["returnType"] = _returnType;
    json["parameters"] = _parameters;
    json["sync"] = _sync;
    
    return json;
}

bool FunctionCallConfig::isValid() const {
    if (_name.empty()) {
        return false;
    }
    
    return true;
}

std::string FunctionCallConfig::getFullName() const {
    if (_namespace.empty()) {
        return _name;
    }
    return _namespace + "::" + _name;
}

} // namespace agenui
