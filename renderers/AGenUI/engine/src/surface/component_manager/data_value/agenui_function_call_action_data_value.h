#pragma once

#include "agenui_data_value_base.h"
#include "agenui_callable_data_value.h"
#include <memory>
#include <string>

namespace agenui {

class IDataModel;
class IDataChangedObserver;

/**
 * @brief Function-call action data value
 * @remark Represents a functionCall action as defined by the Action.functionCall structure in the A2UI v0.9 spec
 */
class FunctionCallActionDataValue : public DataValue {
public:
    FunctionCallActionDataValue(IDataModel* dataModel, std::shared_ptr<CallableDataValue> functionCall);
    virtual ~FunctionCallActionDataValue();

    DataType getDataType() const override;
    DataBindingStatus getDataBindingStatus() const override;
    SerializableData getValueData() const override;
    void bind(IDataChangedObserver* observer) override;
    void unbind() override;
    std::shared_ptr<DataValue> cloneAsTemplate(const std::string& rootDataPath) const override;

    std::shared_ptr<CallableDataValue> getFunctionCall() const;

    /**
     * @brief Execute the function-call action
     * @return Return value of the function call
     */
    SerializableData execute() const;

private:
    std::shared_ptr<CallableDataValue> _functionCall;
};

}  // namespace agenui