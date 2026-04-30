#pragma once

#include <string>
#include <functional>
#include "surface/agenui_serializable_data.h"

namespace agenui {

/**
 * @brief ExpressionParser class
 * @remark Responsible for parsing various expressions in the A2UI protocol
 */
class ExpressionParser {
public:
    /**
     * @brief Data getter callback function type
     * @param path JSON Pointer path
     * @return Data value at the given path (as a string)
     */
    using DataGetter = std::function<std::string(const std::string& path)>;
    
    /**
     * @brief Constructor
     * @param dataGetter Data getter callback function
     */
    explicit ExpressionParser(DataGetter dataGetter);

    /**
     * @brief Destructor
     */
    ~ExpressionParser();
    
    /**
     * @brief Handle a function call expression
     * @param functionCall Function call object containing 'call' and 'args' fields
     * @return Function execution result
     * @remark Parses and executes JSON-format function calls such as formatString, openUrl, etc.
     * @warning This method does not recursively resolve nested expressions inside args (except formatString).
     *          Use DataValueParser::parseDataValue if recursive resolution of nested expressions is needed.
     * @note formatString is handled specially because it requires access to the dataModel for string interpolation.
     *       Args for other functions are passed directly to FunctionCallManager without recursive parsing.
     * @example
     * Example 1 - simple function call (no args):
     * {
     *   "call": "now",
     *   "args": {}
     * }
     *
     * Example 2 - function call with static args:
     * {
     *   "call": "formatDate",
     *   "args": {
     *     "value": "2026-02-07T16:40:00Z",
     *     "format": "yyyy-MM-dd"
     *   }
     * }
     *
     * Example 3 - formatString (special handling, supports interpolation):
     * {
     *   "call": "formatString",
     *   "args": {
     *     "value": "Hello, ${/user/firstName}! Welcome back."
     *   }
     * }
     *
     * Example 4 - open URL function:
     * {
     *   "call": "openUrl",
     *   "args": {
     *     "url": "https://example.com"
     *   }
     * }
     *
     * Unsupported - nested expressions (expressions inside args are not resolved):
     * {
     *   "call": "formatDate",
     *   "args": {
     *     "value": {"path": "/currentDate"},  // ❌ this path will NOT be resolved
     *     "format": "yyyy-MM-dd"
     *   }
     * }
     *
     * To handle nested expressions, use DataValueParser:
     * auto dataValue = DataValueParser::parseDataValue(functionCallJson);
     * dataValue->setDataModel(dataModel);
     * std::string result = dataValue->getStringData();
     */
    SerializableData handleFunctionCall(const SerializableData& functionCall);
    
    /**
     * @brief Handle a plain string expression (may contain interpolations)
     * @param stringExpression String expression, e.g. "Hello, ${/user/firstName}! Data: ${now()}"
     * @return Fully resolved string
     * @remark Resolves ${...} interpolation expressions in the string; supports data-binding paths and function calls
     * @example
     * Example 1 - plain text:
     * "Hello, World!"
     *
     * Example 2 - data-binding interpolation (absolute path):
     * "Hello, ${/user/firstName}!"
     *
     * Example 3 - function call interpolation:
     * "Current time: ${now()}"
     *
     * Example 4 - mixed interpolation:
     * "Hello, ${/user/firstName}! Welcome back to ${/appName}."
     *
     * Example 5 - function call with args:
     * "Formatted date: ${formatDate(value:${/currentDate}, format:'yyyy-MM-dd')}"
     *
     * Example 6 - multiple interpolations:
     * "User: ${/user/name}, Age: ${/user/age}, Login: ${now()}"
     */
    std::string handleExpressionString(const std::string& stringExpression);

private:
    DataGetter _dataGetter;            // Data getter callback

    /**
     * @brief Recursively resolve function arguments
     * @param args Argument object
     * @return Resolved argument object
     */
    SerializableData parseArguments(const SerializableData& args);
};

}  // namespace agenui
