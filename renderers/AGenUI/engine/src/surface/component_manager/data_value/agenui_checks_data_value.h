#pragma once

#include "agenui_data_value_base.h"
#include <string>
#include <vector>
#include <memory>

namespace agenui {

class IDataModel;
class IDataChangedObserver;

/**
 * @brief Checks data value
 * @remark Represents a set of validation check items with implicit AND logic
 */
class ChecksDataValue : public DataValue {
public:
    ChecksDataValue(IDataModel* dataModel, const std::vector<std::shared_ptr<DataValue>>& checks);
    
    DataType getDataType() const override;
    DataBindingStatus getDataBindingStatus() const override;
    SerializableData getValueData() const override;
    void bind(IDataChangedObserver* observer) override;
    void unbind() override;
    std::shared_ptr<DataValue> cloneAsTemplate(const std::string& rootDataPath) const override;

private:
    std::vector<std::shared_ptr<DataValue>> _checks;
};

}  // namespace agenui