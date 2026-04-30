#pragma once

#include "agenui_data_value_base.h"
#include "agenui_static_data_value.h"
#include "agenui_bindable_data_value.h"
#include "agenui_parseable_data_value.h"
#include "agenui_callable_data_value.h"
#include "agenui_interpolation_bindable_data_value.h"
#include "agenui_checks_data_value.h"
#include "agenui_checks_and_data_value.h"
#include "agenui_checks_or_data_value.h"
#include "agenui_styles_data_value.h"
#include "agenui_tabs_data_value.h"
#include "agenui_event_action_data_value.h"
#include "agenui_function_call_action_data_value.h"
#include <string>
#include <memory>

namespace agenui {

/**
 * @brief Data value parser
 * @remark Provides static methods for parsing various data value types
 */
class DataValueParser {
public:
    /**
     * @brief Parse a data value (generic)
     * @param dataModel Data model pointer
     * @param valueJson Data value JSON string
     * @return DataValue smart pointer
     */
    static std::shared_ptr<DataValue> parseDataValue(IDataModel* dataModel, const std::string& valueJson);

    /**
     * @brief Parse a checks data value array
     * @param dataModel Data model pointer
     * @param valueJson JSON array string
     * @return ChecksDataValue smart pointer
     */
    static std::shared_ptr<ChecksDataValue> parseChecksDataValue(IDataModel* dataModel, const std::string& valueJson);

    /**
     * @brief Parse a styles data value
     * @param dataModel Data model pointer
     * @param valueJson JSON string
     * @return StylesDataValue smart pointer
     */
    static std::shared_ptr<StylesDataValue> parseStylesDataValue(IDataModel* dataModel, const std::string& valueJson);

    /**
     * @brief Parse a tabs data value
     * @param dataModel Data model pointer
     * @param valueJson JSON array string, e.g. [{"title": "aaaa", "child": "driving_content"}]
     * @return TabsDataValue smart pointer
     */
    static std::shared_ptr<TabsDataValue> parseTabsDataValue(IDataModel* dataModel, const std::string& valueJson);

    /**
     * @brief Parse an event action data value
     * @param dataModel Data model pointer
     * @param valueJson JSON string
     * @return EventActionDataValue smart pointer
     */
    static std::shared_ptr<EventActionDataValue> parseEventActionDataValue(IDataModel* dataModel, const std::string& valueJson);

    /**
     * @brief Parse a function-call action data value
     * @param dataModel Data model pointer
     * @param valueJson JSON string
     * @return FunctionCallActionDataValue smart pointer
     */
    static std::shared_ptr<FunctionCallActionDataValue> parseFunctionCallActionDataValue(IDataModel* dataModel, const std::string& valueJson);

private:
    /**
     * @brief Parse a string interpolation bindable data value
     * @param dataModel Data model pointer
     * @param valueJson JSON string
     * @return InterpolationBindableDataValue smart pointer
     */
    static std::shared_ptr<InterpolationBindableDataValue> parseInterpolationBindableDataValue(IDataModel* dataModel, const std::string& valueJson);

    /**
     * @brief Parse a callable data value
     * @param dataModel Data model pointer
     * @param valueJson JSON string
     * @return CallableDataValue smart pointer
     */
    static std::shared_ptr<CallableDataValue> parseCallableDataValue(IDataModel* dataModel, const std::string& valueJson);

    /**
     * @brief Parse a bindable data value
     * @param dataModel Data model pointer
     * @param valueJson JSON string
     * @return BindableDataValue smart pointer
     */
    static std::shared_ptr<BindableDataValue> parseBindableDataValue(IDataModel* dataModel, const std::string& valueJson);

    /**
     * @brief Parse a static data value
     * @param valueJson JSON string
     * @return StaticDataValue smart pointer
     */
    static std::shared_ptr<StaticDataValue> parseStaticDataValue(const std::string& valueJson);

    /**
     * @brief Parse a logic checks data value (AND or OR)
     * @param dataModel Data model pointer
     * @param valueJson JSON string
     * @param logicKey Logic key ("and" or "or")
     * @return DataValue smart pointer (ChecksAndDataValue or ChecksOrDataValue)
     */
    static std::shared_ptr<DataValue> parseChecksLogicDataValue(IDataModel* dataModel, const std::string& valueJson, const std::string& logicKey);

    /**
     * @brief Extract interpolation expressions from a string
     * @param str Input string
     * @return List of interpolation paths
     */
    static std::vector<std::string> extractInterpolations(const std::string& str);
};

}  // namespace agenui
