#include "agenui_event_action_data_value.h"
#include "surface/datamodel/agenui_idata_model.h"
#include "surface/datamodel/agenui_data_observer.h"
#include "surface/virtual_dom/agenui_component_snapshot.h"
#include "module/agenui_event_dispatcher.h"
#include "agenui_dispatcher_types.h"
#include "surface/agenui_serializable_data_impl.h"
#include <chrono>
#include <ctime>

namespace agenui {

EventActionDataValue::EventActionDataValue(IDataModel* dataModel, const std::string& eventName, const std::map<std::string, std::shared_ptr<DataValue>>& context) : DataValue(dataModel), _eventName(eventName), _context(context) {
}

EventActionDataValue::~EventActionDataValue() {
    unbind();
}

DataType EventActionDataValue::getDataType() const {
    return DataType::EventActionData;
}

DataBindingStatus EventActionDataValue::getDataBindingStatus() const {
    std::vector<DataBindingStatus> statuses;
    for (const auto& pair : _context) {
        if (pair.second) {
            statuses.emplace_back(pair.second->getDataBindingStatus());
        }
    }
    return aggregateBindingStatus(statuses);
}

SerializableData EventActionDataValue::getValueData() const {
    auto impl = SerializableData::Impl::createObject();
    return SerializableData(impl);
}

std::string EventActionDataValue::getEventName() const {
    return _eventName;
}

std::map<std::string, std::shared_ptr<DataValue>> EventActionDataValue::getContext() const {
    return _context;
}

void EventActionDataValue::bind(IDataChangedObserver* observer) {
    for (auto& pair : _context) {
        if (pair.second) {
            pair.second->bind(observer);
        }
    }
}

void EventActionDataValue::unbind() {
    for (auto& pair : _context) {
        if (pair.second) {
            pair.second->unbind();
        }
    }
}

std::shared_ptr<DataValue> EventActionDataValue::cloneAsTemplate(const std::string& rootDataPath) const {
    std::map<std::string, std::shared_ptr<DataValue>> clonedContext;
    
    for (const auto& pair : _context) {
        if (pair.second) {
            clonedContext[pair.first] = pair.second->cloneAsTemplate(rootDataPath);
        }
    }
    
    auto cloned = std::make_shared<EventActionDataValue>(_dataModel, _eventName, clonedContext);
    cloned->_extensions = _extensions;
    
    return cloned;
}

void EventActionDataValue::execute(const std::string& surfaceId, const std::string& sourceComponentId, EventDispatcher* dispatcher) const {
    if (!dispatcher) {
        return;
    }
    
    auto contextImpl = SerializableData::Impl::createObject();
    for (const auto& pair : _context) {
        if (!pair.second) {
            continue;
        }
        
        auto valueData = pair.second->getValueData();
        if (!valueData.isValid()) {
            continue;
        }

        contextImpl->set(pair.first, valueData);
    }
    SerializableData contextData(contextImpl);
    
    // Generate ISO 8601 timestamp
    auto now = std::chrono::system_clock::now();
    auto timeT = std::chrono::system_clock::to_time_t(now);
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()) % 1000;

    std::tm tm;
#ifdef _WIN32
    localtime_s(&tm, &timeT);
#else
    localtime_r(&timeT, &tm);
#endif

    char buffer[32];
    std::strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S", &tm);
    std::string timestamp = std::string(buffer) + "." + std::to_string(ms.count()) + "Z";

    // Build an action event conforming to the A2UI client_to_server.json spec
    auto actionDataImpl = SerializableData::Impl::createObject();
    actionDataImpl->set("name", _eventName);
    actionDataImpl->set("surfaceId", surfaceId);
    actionDataImpl->set("sourceComponentId", sourceComponentId);
    actionDataImpl->set("timestamp", timestamp);
    actionDataImpl->set("context", contextData);

    auto actionEventImpl = SerializableData::Impl::createObject();
    actionEventImpl->set("version", std::string("v0.9"));
    actionEventImpl->set("action", SerializableData(actionDataImpl));
    dispatcher->dispatchActionEventRouted(SerializableData(actionEventImpl).dump());
}

}  // namespace agenui
