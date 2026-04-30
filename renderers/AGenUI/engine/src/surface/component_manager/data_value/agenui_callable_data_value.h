#pragma once

#include "agenui_data_value_base.h"
#include <string>
#include <map>
#include <memory>

namespace agenui {

class IDataModel;
class IDataChangedObserver;

/**
 * @brief Callable data value
 * @remark Represents a function call, including the function name and its arguments
 */
class CallableDataValue : public DataValue {
public:
    CallableDataValue(IDataModel* dataModel, const std::string& functionName, const std::map<std::string, std::shared_ptr<DataValue>>& args);
    
    DataType getDataType() const override;
    DataBindingStatus getDataBindingStatus() const override;
    SerializableData getValueData() const override;
    void bind(IDataChangedObserver* observer) override;
    void unbind() override;
    std::shared_ptr<DataValue> cloneAsTemplate(const std::string& rootDataPath) const override;
    
    std::string getFunctionName() const;
    std::map<std::string, std::shared_ptr<DataValue>> getArgs() const;

private:
    std::string _functionName;
    std::map<std::string, std::shared_ptr<DataValue>> _args;
};

}  // namespace agenui