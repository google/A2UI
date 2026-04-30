#include "agenui_string_expression_parser.h"
#include "agenui_serializable_data_impl.h"
#include "agenui_log.h"
#include <algorithm>

namespace agenui {

StringExpressionParser::StringExpressionParser(DataGetter dataGetter, FunctionCaller functionCaller)
    : _dataGetter(dataGetter), _functionCaller(functionCaller), _maxRecursionDepth(10) {
}

StringExpressionParser::~StringExpressionParser() {
}

std::string StringExpressionParser::parse(const std::string& expression) {
    return parseInternal(expression, 0);
}

void StringExpressionParser::setMaxRecursionDepth(int depth) {
    _maxRecursionDepth = depth;
}

std::string StringExpressionParser::parseInternal(const std::string& expression, int currentDepth) {
    if (currentDepth >= _maxRecursionDepth) {
        AGENUI_LOG("max recursion depth reached");
        return expression;
    }

    if (expression.find("${") == std::string::npos) {
        return expression;
    }

    std::string result = expression;
    size_t pos = 0;

    while ((pos = result.find("${", pos)) != std::string::npos) {
        size_t endPos = findMatchingBrace(result, pos + 2);
        if (endPos == std::string::npos) {
            AGENUI_LOG("unmatched brace at position %zu", pos);
            pos += 2;
            continue;
        }

        std::string exprContent = result.substr(pos + 2, endPos - pos - 2);
        exprContent = trim(exprContent);

        if (exprContent.empty()) {
            pos = endPos + 1;
            continue;
        }

        std::string replacement;
        if (isDataPath(exprContent)) {
            replacement = handleDataBinding(exprContent);
        } else if (isFunctionCall(exprContent)) {
            // Recursively resolve nested expressions in args before dispatching the function call
            std::string processedExpr = parseInternal(exprContent, currentDepth + 1);
            replacement = handleFunctionCall(processedExpr);
        } else {
            AGENUI_LOG("unknown expression type: %s", exprContent.c_str());
            pos = endPos + 1;
            continue;
        }

        result.replace(pos, endPos - pos + 1, replacement);
        pos += replacement.length();
    }
    
    return result;
}

size_t StringExpressionParser::findMatchingBrace(const std::string& str, size_t startPos) {
    int braceCount = 1;
    size_t i = startPos;
    
    while (i < str.length()) {
        if (i > 0 && str[i - 1] == '$' && str[i] == '{') {
            braceCount++;
            i++;
        } else if (str[i] == '}') {
            braceCount--;
            if (braceCount == 0) {
                return i;
            }
        }
        i++;
    }
    
    return std::string::npos;
}

std::string StringExpressionParser::handleDataBinding(const std::string& path) {
    if (!_dataGetter) {
        AGENUI_LOG("dataGetter is null");
        return "";
    }
    
    std::string value = _dataGetter(path);

    // Try to parse the returned string as JSON
    nlohmann::json parsedValue = nlohmann::json::parse(value, nullptr, false);

    if (!parsedValue.is_discarded()) {
        if (parsedValue.is_string()) {
            return parsedValue.get<std::string>();
        } else if (parsedValue.is_number()) {
            return std::to_string(parsedValue.get<double>());
        } else if (parsedValue.is_boolean()) {
            return parsedValue.get<bool>() ? "true" : "false";
        } else if (parsedValue.is_null()) {
            return "";
        } else {
            return parsedValue.dump();
        }
    }

    // Parse failed: the value is a plain string; return as-is
    AGENUI_LOG("path: %s, value: %s", path.c_str(), value.c_str());
    return value;
}

std::string StringExpressionParser::handleFunctionCall(const std::string& expression) {
    if (!_functionCaller) {
        AGENUI_LOG("functionCaller is null");
        return "";
    }
    
    nlohmann::json funcCall = parseFunctionExpression(expression);
    if (funcCall.is_null() || !funcCall.contains("call")) {
        AGENUI_LOG("invalid function expression: %s", expression.c_str());
        return "";
    }
    
    SerializableData funcCallData(SerializableData::Impl::create(std::move(funcCall)));
    SerializableData result = _functionCaller(funcCallData);

    if (result.isString()) {
        return result.asString();
    } else if (result.isNumber()) {
        return std::to_string(result.asDouble());
    } else if (result.isBool()) {
        return result.asBool() ? "true" : "false";
    } else if (result.isNull()) {
        return "";
    } else {
        return result.dump();
    }
}

nlohmann::json StringExpressionParser::parseFunctionExpression(const std::string& expression) {
    size_t parenPos = expression.find('(');
    if (parenPos == std::string::npos) {
        return nlohmann::json();
    }

    std::string funcName = trim(expression.substr(0, parenPos));
    if (funcName.empty()) {
        return nlohmann::json();
    }

    // Extract args string, stripping the trailing ')'
    std::string argsStr = expression.substr(parenPos + 1);
    if (!argsStr.empty() && argsStr.back() == ')') {
        argsStr.pop_back();
    }
    argsStr = trim(argsStr);

    nlohmann::json result;
    result["call"] = funcName;

    if (!argsStr.empty()) {
        nlohmann::json args = nlohmann::json::object();

        // Simplified arg parsing: supports "key: value" format
        size_t colonPos = argsStr.find(':');
        if (colonPos != std::string::npos) {
            std::string key = trim(argsStr.substr(0, colonPos));
            std::string value = trim(argsStr.substr(colonPos + 1));

            // Strip surrounding quotes from the value
            if (!value.empty() && (value.front() == '\'' || value.front() == '"')) {
                if (value.length() >= 2 && value.front() == value.back()) {
                    value = value.substr(1, value.length() - 2);
                }
            }

            args[key] = value;
        }

        result["args"] = args;
    }
    
    AGENUI_LOG("expression: %s, result: %s", expression.c_str(), result.dump().c_str());
    return result;
}

bool StringExpressionParser::isDataPath(const std::string& expression) {
    if (expression.empty()) {
        return false;
    }
    return expression[0] == '/';
}

bool StringExpressionParser::isFunctionCall(const std::string& expression) {
    return expression.find('(') != std::string::npos && expression.find(')') != std::string::npos;
}

std::string StringExpressionParser::trim(const std::string& str) {
    if (str.empty()) {
        return str;
    }
    
    size_t start = str.find_first_not_of(" \t\r\n");
    if (start == std::string::npos) {
        return "";
    }
    
    size_t end = str.find_last_not_of(" \t\r\n");
    return str.substr(start, end - start + 1);
}

}  // namespace agenui
