#pragma once

#include "agenui_data_value_base.h"
#include <string>
#include <memory>

namespace agenui {

class IDataModel;
class IDataChangedObserver;

/**
 * @brief Parseable data value
 * @remark Represents a dynamic value whose raw string contains an expression to be parsed
 */
class ParseableDataValue : public DataValue {
public:
    ParseableDataValue(IDataModel* dataModel, const std::string& rawString);
    
    DataType getDataType() const override;
    DataBindingStatus getDataBindingStatus() const override;
    SerializableData getValueData() const override;
    void bind(IDataChangedObserver* observer) override;
    void unbind() override;
    std::shared_ptr<DataValue> cloneAsTemplate(const std::string& rootDataPath) const override;

private:
    std::string parseExpression() const;
    
    std::string _rawString;
};

}  // namespace agenui