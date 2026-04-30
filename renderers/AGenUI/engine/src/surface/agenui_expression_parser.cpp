#include "agenui_expression_parser.h"
#include "agenui_string_expression_parser.h"
#include "agenui_serializable_data_impl.h"
#include "function_call/builtins/agenui_format_string_functioncall.h"
#include "component_manager/data_value/agenui_data_value_parser.h"
#include "datamodel/agenui_idata_model.h"
#include "function_call/agenui_functioncall_manager.h"
#include "function_call/agenui_functioncall_resolution.h"
#include "agenui_engine_context.h"
#include "agenui_log.h"
#include "nlohmann/json.hpp"

namespace agenui {

ExpressionParser::ExpressionParser(DataGetter dataGetter)
    : _dataGetter(dataGetter) {
}

ExpressionParser::~ExpressionParser() {
}

std::string ExpressionParser::handleExpressionString(const std::string& stringExpression) {
    StringExpressionParser parser(
        _dataGetter,
        [this](const SerializableData& functionCall) -> SerializableData {
            return handleFunctionCall(functionCall);
        }
    );

    std::string result = parser.parse(stringExpression);
    AGENUI_LOG("exp:%s, result:%s", stringExpression.c_str(), result.c_str());
    return result;
}

SerializableData ExpressionParser::handleFunctionCall(const SerializableData& functionCall) {
    if (functionCall["call"].isNull() || functionCall["call"].asString().empty()) {
        AGENUI_LOG("error: missing or invalid 'call' field");
        return SerializableData();
    }

    std::string functionName = functionCall["call"].asString();
    SerializableData parsedArgs(SerializableData::Impl::createObject());
    if (functionCall.contains("args") && functionCall["args"].isObject()) {
        AGENUI_LOG("parsing args: %s", functionCall["args"].dump().c_str());
        parsedArgs = parseArguments(functionCall["args"]);
        AGENUI_LOG("parsed args: %s", parsedArgs.dump().c_str());
    }

    const nlohmann::json& jsonArgs = *parsedArgs.getImpl()->node;
    AGENUI_LOG("calling FunctionCallManager.executeFunctionCallSync: name:%s, args:%s", functionName.c_str(), parsedArgs.dump().c_str());
    auto* functionCallManager = getEngineContext()->getFunctionCallManager();
    if (functionCallManager == nullptr) {
        AGENUI_LOG("error: FunctionCallManager is null");
        return SerializableData();
    }
    FunctionCallResolution result = functionCallManager->executeFunctionCallSync(functionName, jsonArgs);

    if (result.getStatus() == FunctionCallStatus::Success) {
        SerializableData resultValue(SerializableData::Impl::create(result.getValue()));
        AGENUI_LOG("success: result=%s", resultValue.dump().c_str());
        return resultValue;
    } else {
        AGENUI_LOG("error: %s", result.getError().c_str());
        return SerializableData();
    }
}

SerializableData ExpressionParser::parseArguments(const SerializableData& args) {
    auto resultImpl = SerializableData::Impl::createObject();
    
    for (auto it = args.begin(); it != args.end(); ++it) {
        const std::string& key = it.key();
        SerializableData value = it.value();
        if (value.isString()) {
            // String: resolve interpolations via handleExpressionString
            resultImpl->set(key, handleExpressionString(value.asString()));
        } else if (!value.isNull()) {
            // Number, bool, array, object: pass through; skip null to avoid sending invalid values to functionCalls
            resultImpl->set(key, value);
        }
    }
    
    SerializableData result(resultImpl);
    AGENUI_LOG("args:%s, result:%s", args.dump().c_str(), result.dump().c_str());
    return result;
}

}  // namespace agenui
