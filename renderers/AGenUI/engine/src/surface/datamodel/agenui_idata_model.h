#pragma once

#include <string>
#include <memory>
#include "surface/agenui_serializable_data.h"

namespace agenui {

class IDataChangedObserver;
class IDataAccessor;

/**
 * @brief Data model interface defining basic data operations
 */
class IDataModel {
public:
    virtual ~IDataModel() = default;

    /**
     * @brief Sync a binding value — updates the value at path and notifies observers
     * @param path data path
     * @param value new data value
     */
    virtual void syncBindingValue(const std::string& path, const std::string& value) = 0;

    /**
     * @brief Update data at the given path
     * @param path data path
     * @param jsonValue JSON-encoded value; adds or replaces the node in the data tree
     */
    virtual void updateData(const std::string& path, const std::string& jsonValue) = 0;

    /**
     * @brief Incrementally merge data at the given path
     * @param path data path
     * @param jsonValue JSON-encoded incremental data; recursively merges objects, overwrites leaf nodes
     */
    virtual void appendData(const std::string& path, const std::string& jsonValue) = 0;

    /**
     * @brief Get the value at the given path
     * @param path data path
     * @return SerializableData; empty if the path does not exist
     */
    virtual SerializableData getValue(const std::string& path) = 0;

    /**
     * @brief Bind an observer to the given path
     * @param path data path
     * @param observer observer pointer
     */
    virtual void bind(const std::string& path, IDataChangedObserver* observer) = 0;

    /**
     * @brief Unbind an observer from the given path
     * @param path data path
     * @param observer observer pointer
     */
    virtual void unbind(const std::string& path, IDataChangedObserver* observer) = 0;
};

}  // namespace agenui
