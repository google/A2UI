#pragma once

#include <string>

namespace agenui {

/**
 * @brief Observer interface for data change events
 */
class IDataChangedObserver {
public:
    virtual ~IDataChangedObserver() = default;

    /**
     * @brief Called when a data value changes
     * @param path data path
     * @param newValue new value
     * @param appendMode whether this is an append operation
     */
    virtual void onDataChanged(const std::string& path, const std::string& newValue, bool appendMode = false) = 0;
};

}  // namespace agenui
