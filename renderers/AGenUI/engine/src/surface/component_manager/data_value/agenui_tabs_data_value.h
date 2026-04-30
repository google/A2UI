#pragma once

#include "agenui_data_value_base.h"
#include <memory>
#include <string>
#include <vector>

namespace agenui {

class IDataModel;
class IDataChangedObserver;

/**
 * @brief Tab item structure
 */
struct TabItem {
    std::shared_ptr<DataValue> title;  // Tab title
    std::string child;                 // Child component ID
};

/**
 * @brief Tabs data value
 * @remark Represents the data for a Tabs component, containing multiple tab items
 */
class TabsDataValue : public DataValue {
public:
    TabsDataValue(IDataModel* dataModel, const std::vector<TabItem>& tabs);
    virtual ~TabsDataValue();

    DataType getDataType() const override;
    DataBindingStatus getDataBindingStatus() const override;
    SerializableData getValueData() const override;
    void bind(IDataChangedObserver* observer) override;
    void unbind() override;
    std::shared_ptr<DataValue> cloneAsTemplate(const std::string& rootDataPath) const override;

    std::vector<std::string> getTabChildren() const;

private:
    std::vector<TabItem> _tabs;
};

}  // namespace agenui