#include "agenui_tabs_data_value.h"
#include "surface/datamodel/agenui_idata_model.h"
#include "surface/datamodel/agenui_data_observer.h"
#include "surface/virtual_dom/agenui_component_snapshot.h"
#include "surface/agenui_serializable_data_impl.h"

namespace agenui {

TabsDataValue::TabsDataValue(IDataModel* dataModel, const std::vector<TabItem>& tabs) : DataValue(dataModel), _tabs(tabs) {
}

TabsDataValue::~TabsDataValue() {
    unbind();
}

DataType TabsDataValue::getDataType() const {
    return DataType::TabsData;
}

DataBindingStatus TabsDataValue::getDataBindingStatus() const {
    std::vector<DataBindingStatus> statuses;
    for (const auto& tab : _tabs) {
        if (tab.title) {
            statuses.emplace_back(tab.title->getDataBindingStatus());
        }
    }
    return aggregateBindingStatus(statuses);
}

SerializableData TabsDataValue::getValueData() const {
    auto impl = SerializableData::Impl::createArray();
    
    for (const auto& tab : _tabs) {
        auto tabImpl = SerializableData::Impl::createObject();

        tabImpl->set("title", "");
        if (tab.title) {
            auto titleValue = tab.title->getValueData();
            if (titleValue.isValid()) {
                tabImpl->set("title", titleValue);
            }
        }

        tabImpl->set("child", tab.child);
        impl->append(SerializableData(tabImpl));
    }
    
    return SerializableData(impl);
}

void TabsDataValue::bind(IDataChangedObserver* observer) {
    for (auto& tab : _tabs) {
        if (tab.title) {
            tab.title->bind(observer);
        }
    }
}

void TabsDataValue::unbind() {
    for (auto& tab : _tabs) {
        if (tab.title) {
            tab.title->unbind();
        }
    }
}

std::shared_ptr<DataValue> TabsDataValue::cloneAsTemplate(const std::string& rootDataPath) const {
    std::vector<TabItem> clonedTabs;
    clonedTabs.reserve(_tabs.size());
    
    for (const auto& tab : _tabs) {
        TabItem clonedTab;
        if (tab.title) {
            clonedTab.title = tab.title->cloneAsTemplate(rootDataPath);
        }
        
        if (!rootDataPath.empty()) {
            clonedTab.child = tab.child + "-" + rootDataPath;
        } else {
            clonedTab.child = tab.child;
        }
        
        clonedTabs.emplace_back(clonedTab);
    }
    
    auto cloned = std::make_shared<TabsDataValue>(_dataModel, clonedTabs);
    cloned->_extensions = _extensions;
    
    return cloned;
}

std::vector<std::string> TabsDataValue::getTabChildren() const {
    std::vector<std::string> children;
    children.reserve(_tabs.size());
    
    for (const auto& tab : _tabs) {
        children.emplace_back(tab.child);
    }
    
    return children;
}

}  // namespace agenui
