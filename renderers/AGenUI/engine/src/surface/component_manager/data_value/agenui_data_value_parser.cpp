#include "agenui_data_value_parser.h"
#include "nlohmann/json.hpp"
#include <regex>
#include "agenui_log.h"
#include "surface/component_manager/data_value/agenui_tabs_data_value.h"

namespace agenui {

std::shared_ptr<DataValue> DataValueParser::parseDataValue(IDataModel* dataModel, const std::string& valueJson) {
    auto checksAndValue = parseChecksLogicDataValue(dataModel, valueJson, "and");
    if (checksAndValue) {
        return checksAndValue;
    }

    auto checksOrValue = parseChecksLogicDataValue(dataModel, valueJson, "or");
    if (checksOrValue) {
        return checksOrValue;
    }

    auto callableValue = parseCallableDataValue(dataModel, valueJson);
    if (callableValue) {
        return callableValue;
    }

    auto bindableValue = parseBindableDataValue(dataModel, valueJson);
    if (bindableValue) {
        return bindableValue;
    }

    auto interpolationBindableValue = parseInterpolationBindableDataValue(dataModel, valueJson);
    if (interpolationBindableValue) {
        return interpolationBindableValue;
    }

    return parseStaticDataValue(valueJson);
}

std::vector<std::string> DataValueParser::extractInterpolations(const std::string& str) {
    std::vector<std::string> paths;

    // Match ${...} expressions, excluding parentheses inside the braces
    std::regex pattern("\\$\\{([^{}()]+)\\}");
    std::sregex_iterator iter(str.begin(), str.end(), pattern);
    std::sregex_iterator end;

    while (iter != end) {
        std::string path = (*iter)[1].str();

        size_t start = path.find_first_not_of(" \t");
        if (start != std::string::npos) {
            size_t end = path.find_last_not_of(" \t");
            path = path.substr(start, end - start + 1);
        }

        if (!path.empty()) {
            paths.push_back(path);
        }

        ++iter;
    }

    return paths;
}

std::shared_ptr<InterpolationBindableDataValue> DataValueParser::parseInterpolationBindableDataValue(IDataModel* dataModel, const std::string& valueJson) {
    nlohmann::json json = nlohmann::json::parse(valueJson, nullptr, false);

    if (json.is_discarded() || !json.is_string()) {
        return nullptr;
    }

    std::string str = json.get<std::string>();

    std::vector<std::string> paths = extractInterpolations(str);

    if (paths.empty()) {
        return nullptr;
    }

    return std::make_shared<InterpolationBindableDataValue>(dataModel, valueJson, paths);
}

std::shared_ptr<CallableDataValue> DataValueParser::parseCallableDataValue(IDataModel* dataModel, const std::string& valueJson) {
    nlohmann::json json;
    try {
        json = nlohmann::json::parse(valueJson);
    } catch (const nlohmann::json::exception& e) {
        return nullptr;
    }

    if (!json.is_object()) {
        return nullptr;
    }

    if (!json.contains("call")) {
        return nullptr;
    }

    if (!json["call"].is_string()) {
        return nullptr;
    }

    std::string functionName = json["call"].get<std::string>();

    std::map<std::string, std::shared_ptr<DataValue>> args;

    if (json.contains("args")) {
        const auto& argsJson = json["args"];

        if (!argsJson.is_object()) {
            return nullptr;
        }

        for (auto it = argsJson.begin(); it != argsJson.end(); ++it) {
            std::string paramName = it.key();
            std::string argValueJson = it.value().dump();
            auto argValue = parseDataValue(dataModel, argValueJson);

            if (!argValue) {
                continue;
            }

            args[paramName] = argValue;
        }
    }

    auto callableValue = std::make_shared<CallableDataValue>(dataModel, functionName, args);

    if (json.contains("message") && json["message"].is_string()) {
        callableValue->setExtension("message", json["message"].get<std::string>());
    }

    return callableValue;
}

std::shared_ptr<BindableDataValue> DataValueParser::parseBindableDataValue(IDataModel* dataModel, const std::string& valueJson) {
    auto json = nlohmann::json::parse(valueJson, nullptr, false);

    if (json.is_discarded()) {
        return nullptr;
    }

    if (json.is_object() && json.contains("path")) {
        AGENUI_LOG("%s", valueJson.c_str());
        std::string path = json["path"].get<std::string>();
        return std::make_shared<BindableDataValue>(dataModel, path);
    }

    return nullptr;
}

std::shared_ptr<StaticDataValue> DataValueParser::parseStaticDataValue(const std::string& valueJson) {
    if (valueJson.empty()) {
        return std::make_shared<StaticDataValue>("");
    }

    auto jsonObj = nlohmann::json::parse(valueJson, nullptr, false);
    if (jsonObj.is_discarded()) {
        return std::make_shared<StaticDataValue>(valueJson);
    }

    return std::make_shared<StaticDataValue>(jsonObj.dump());
}

std::shared_ptr<ChecksDataValue> DataValueParser::parseChecksDataValue(IDataModel* dataModel, const std::string& valueJson) {
    nlohmann::json json;
    try {
        json = nlohmann::json::parse(valueJson);
    } catch (const nlohmann::json::exception& e) {
        return nullptr;
    }

    if (!json.is_array()) {
        return nullptr;
    }

    std::vector<std::shared_ptr<DataValue>> checkItems;
    for (const auto& checkJson : json) {
        std::string checkJsonStr = checkJson.dump();
        auto checkValue = parseDataValue(dataModel, checkJsonStr);

        if (!checkValue) {
            continue;
        }

        checkItems.emplace_back(checkValue);
    }

    if (checkItems.empty()) {
        return nullptr;
    }

    return std::make_shared<ChecksDataValue>(dataModel, checkItems);
}

std::shared_ptr<DataValue> DataValueParser::parseChecksLogicDataValue(IDataModel* dataModel, const std::string& valueJson, const std::string& logicKey) {
    nlohmann::json json;
    try {
        json = nlohmann::json::parse(valueJson);
    } catch (const nlohmann::json::exception& e) {
        return nullptr;
    }

    if (!json.is_object() || !json.contains(logicKey)) {
        return nullptr;
    }

    const auto& logicArray = json[logicKey];
    if (!logicArray.is_array()) {
        return nullptr;
    }

    std::vector<std::shared_ptr<DataValue>> items;
    for (const auto& itemJson : logicArray) {
        std::string itemJsonStr = itemJson.dump();
        auto itemValue = parseDataValue(dataModel, itemJsonStr);

        if (!itemValue) {
            continue;
        }

        items.emplace_back(itemValue);
    }

    if (items.empty()) {
        return nullptr;
    }

    std::shared_ptr<DataValue> result = nullptr;

    if (logicKey == "and") {
        result = std::make_shared<ChecksAndDataValue>(dataModel, items);
    } else if (logicKey == "or") {
        result = std::make_shared<ChecksOrDataValue>(dataModel, items);
    }

    if (result && json.contains("message") && json["message"].is_string()) {
        result->setExtension("message", json["message"].get<std::string>());
    }

    return result;
}

std::shared_ptr<StylesDataValue> DataValueParser::parseStylesDataValue(IDataModel* dataModel, const std::string& valueJson) {
    nlohmann::json json;
    try {
        json = nlohmann::json::parse(valueJson);
    } catch (const nlohmann::json::exception& e) {
        return nullptr;
    }

    if (!json.is_object()) {
        return nullptr;
    }

    std::map<std::string, std::shared_ptr<DataValue>> styles;
    for (auto it = json.begin(); it != json.end(); ++it) {
        std::string styleName = it.key();
        std::string styleValueJson = it.value().dump();
        auto styleValue = parseDataValue(dataModel, styleValueJson);

        if (!styleValue) {
            continue;
        }

        styles[styleName] = styleValue;
    }

    if (styles.empty()) {
        return nullptr;
    }

    return std::make_shared<StylesDataValue>(dataModel, styles);
}

std::shared_ptr<TabsDataValue> DataValueParser::parseTabsDataValue(IDataModel* dataModel, const std::string& valueJson) {
    nlohmann::json json;
    try {
        json = nlohmann::json::parse(valueJson);
    } catch (const nlohmann::json::exception& e) {
        return nullptr;
    }

    if (!json.is_array()) {
        return nullptr;
    }

    std::vector<TabItem> tabs;
    for (const auto& itemJson : json) {
        if (!itemJson.is_object()) {
            continue;
        }

        if (!itemJson.contains("title") || !itemJson.contains("child")) {
            continue;
        }

        std::string titleJson = itemJson["title"].dump();
        auto titleValue = parseDataValue(dataModel, titleJson);

        if (!titleValue) {
            continue;
        }

        std::string child;
        if (itemJson["child"].is_string()) {
            child = itemJson["child"].get<std::string>();
        }

        TabItem tab;
        tab.title = titleValue;
        tab.child = child;
        tabs.emplace_back(tab);
    }

    if (tabs.empty()) {
        return nullptr;
    }

    return std::make_shared<TabsDataValue>(dataModel, tabs);
}

std::shared_ptr<EventActionDataValue> DataValueParser::parseEventActionDataValue(IDataModel* dataModel, const std::string& valueJson) {
    nlohmann::json json;
    try {
        json = nlohmann::json::parse(valueJson);
    } catch (const nlohmann::json::exception& e) {
        return nullptr;
    }

    if (!json.is_object() || !json.contains("event")) {
        return nullptr;
    }

    const auto& eventJson = json["event"];

    if (!eventJson.is_object() || !eventJson.contains("name")) {
        return nullptr;
    }

    if (!eventJson["name"].is_string()) {
        return nullptr;
    }

    std::string eventName = eventJson["name"].get<std::string>();

    std::map<std::string, std::shared_ptr<DataValue>> context;

    if (eventJson.contains("context")) {
        const auto& contextJson = eventJson["context"];

        if (!contextJson.is_object()) {
            return nullptr;
        }

        for (auto it = contextJson.begin(); it != contextJson.end(); ++it) {
            std::string contextKey = it.key();
            std::string contextValueJson = it.value().dump();
            auto contextValue = parseDataValue(dataModel, contextValueJson);

            if (!contextValue) {
                continue;
            }

            context[contextKey] = contextValue;
        }
    }

    return std::make_shared<EventActionDataValue>(dataModel, eventName, context);
}

std::shared_ptr<FunctionCallActionDataValue> DataValueParser::parseFunctionCallActionDataValue(IDataModel* dataModel, const std::string& valueJson) {
    nlohmann::json json;
    try {
        json = nlohmann::json::parse(valueJson);
    } catch (const nlohmann::json::exception& e) {
        return nullptr;
    }

    if (!json.is_object() || !json.contains("functionCall")) {
        return nullptr;
    }

    std::string functionCallJson = json["functionCall"].dump();

    auto callableValue = parseCallableDataValue(dataModel, functionCallJson);

    if (!callableValue) {
        return nullptr;
    }

    return std::make_shared<FunctionCallActionDataValue>(dataModel, callableValue);
}

}  // namespace agenui
