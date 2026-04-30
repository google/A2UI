#pragma once

#include <string>
#include <functional>
#include "surface/agenui_serializable_data.h"
#include "nlohmann/json.hpp"

namespace agenui {

/**
 * @brief StringExpressionParser class
 * @remark Responsible for resolving interpolations (${...}) within string expressions
 */
class StringExpressionParser {
public:
    /**
     * @brief Data getter callback function type
     * @param path Data path
     * @return Data value, or empty string if the path does not exist
     */
    using DataGetter = std::function<std::string(const std::string& path)>;
    
    /**
     * @brief Function caller callback function type
     * @param functionCall Function call JSON object
     * @return Function execution result
     */
    using FunctionCaller = std::function<SerializableData(const SerializableData& functionCall)>;
    
    /**
     * @brief Constructor
     * @param dataGetter Data getter callback function
     * @param functionCaller Function caller callback function
     */
    StringExpressionParser(DataGetter dataGetter, FunctionCaller functionCaller);
    
    /**
     * @brief Destructor
     */
    ~StringExpressionParser();

    /**
     * @brief Parse a string expression
     * @param expression String expression containing interpolations, e.g. "Hello, ${/user/name}!"
     * @return Resolved string
     * @remark Supports nested expressions, e.g. "${formatString(value: 'User ${/user/name}')}"
     */
    std::string parse(const std::string& expression);
    
    /**
     * @brief Set the maximum recursion depth (default: 10)
     * @param depth Maximum recursion depth
     */
    void setMaxRecursionDepth(int depth);

private:
    /**
     * @brief Internal recursive parse implementation
     * @param expression Expression string
     * @param currentDepth Current recursion depth
     * @return Resolved string
     */
    std::string parseInternal(const std::string& expression, int currentDepth);
    
    /**
     * @brief Find the matching closing brace
     * @param str Input string
     * @param startPos Start position (immediately after "${")
     * @return Position of the matching '}', or std::string::npos if not found
     */
    size_t findMatchingBrace(const std::string& str, size_t startPos);
    
    /**
     * @brief Resolve a data-binding expression
     * @param path Data path, e.g. "/user/name"
     * @return Data value
     */
    std::string handleDataBinding(const std::string& path);
    
    /**
     * @brief Resolve a function call expression
     * @param expression Function call expression, e.g. "DateNow()" or "formatString(value: 'text')"
     * @return Function execution result
     */
    std::string handleFunctionCall(const std::string& expression);
    
    /**
     * @brief Parse a function expression into a JSON object
     * @param expression Function expression string
     * @return JSON function call object: {"call": "<name>", "args": {...}}
     */
    nlohmann::json parseFunctionExpression(const std::string& expression);
    
    /**
     * @brief Check whether an expression is a data path
     * @param expression Expression content
     * @return true if it is a data path
     */
    bool isDataPath(const std::string& expression);

    /**
     * @brief Check whether an expression is a function call
     * @param expression Expression content
     * @return true if it is a function call
     */
    bool isFunctionCall(const std::string& expression);

    /**
     * @brief Trim leading and trailing whitespace from a string
     * @param str Input string
     * @return Trimmed string
     */
    std::string trim(const std::string& str);

private:
    DataGetter _dataGetter;           // Data getter callback
    FunctionCaller _functionCaller;   // Function caller callback
    int _maxRecursionDepth;           // Maximum recursion depth
};

}  // namespace agenui
