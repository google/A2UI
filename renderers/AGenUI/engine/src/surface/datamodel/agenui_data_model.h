#pragma once

#include "agenui_idata_model.h"
#include "surface/agenui_serializable_data.h"
#include <string>
#include <memory>
#include <map>
#include <vector>

namespace agenui {

/**
 * @brief DataModel implementation — manages all Surface data; JSON internals hidden via Pimpl
 */
class DataModel : public IDataModel {
public:
    DataModel();
    ~DataModel() override;

    // Non-copyable, non-movable
    DataModel(const DataModel&) = delete;
    DataModel& operator=(const DataModel&) = delete;
    DataModel(DataModel&&) = delete;
    DataModel& operator=(DataModel&&) = delete;

    void syncBindingValue(const std::string& path, const std::string& value) override;
    void updateData(const std::string& path, const std::string& jsonValue) override;
    void appendData(const std::string& path, const std::string& jsonValue) override;
    SerializableData getValue(const std::string& path) override;
    void bind(const std::string& path, IDataChangedObserver* observer) override;
    void unbind(const std::string& path, IDataChangedObserver* observer) override;

private:
    /**
     * @brief Returns true if path equals parentPath or is a direct child of it
     * @param path path to check
     * @param parentPath parent path
     */
    bool isSubPathOrEqual(const std::string& path, const std::string& parentPath) const;

    /**
     * @brief Notify all observers whose registered paths overlap with changedPath
     * @param changedPath path that changed
     * @param appendMode whether this is an append operation
     */
    void notifyAffectedObservers(const std::string& changedPath, bool appendMode = false);

private:
    struct Impl;                                                                  // Pimpl — hides nlohmann::json
    std::unique_ptr<Impl> _impl;
    std::map<std::string, std::vector<IDataChangedObserver*>> _bindingTable;     // path -> observers
};

}  // namespace agenui
