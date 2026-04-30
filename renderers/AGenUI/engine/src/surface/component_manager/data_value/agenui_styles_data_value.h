#pragma once

#include "agenui_data_value_base.h"
#include <map>
#include <memory>
#include <string>

namespace agenui {

class IDataModel;
class IDataChangedObserver;

/**
 * @brief Styles data value
 * @remark Represents a collection of component style properties, supporting dynamic style binding and style management
 */
class StylesDataValue : public DataValue {
public:
    explicit StylesDataValue(IDataModel* dataModel);
    StylesDataValue(IDataModel* dataModel, const std::map<std::string, std::shared_ptr<DataValue>>& styles);
    virtual ~StylesDataValue();

    DataType getDataType() const override;
    DataBindingStatus getDataBindingStatus() const override;
    SerializableData getValueData() const override;
    void bind(IDataChangedObserver* observer) override;
    void unbind() override;
    std::shared_ptr<DataValue> cloneAsTemplate(const std::string& rootDataPath) const override;

    void setStyle(const std::string& styleName, std::shared_ptr<DataValue> value);
    std::shared_ptr<DataValue> getStyle(const std::string& styleName) const;
    void removeStyle(const std::string& styleName);
    const std::map<std::string, std::shared_ptr<DataValue>>& getAllStyles() const;
    void setStyles(const std::map<std::string, std::shared_ptr<DataValue>>& styles, bool merge = true);
    void clearStyles();

private:
    std::map<std::string, std::shared_ptr<DataValue>> _styles;
};

}  // namespace agenui