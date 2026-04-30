#pragma once
#include "surface/agenui_serializable_data.h"
#include "nlohmann/json.hpp"

namespace agenui {

// Impl: internal data storage.
// root owns the JSON data; node points to the current node (may be a child of root).
// operator[] shares root when creating a new SerializableData, only changing the node pointer.
struct SerializableData::Impl {
    std::shared_ptr<nlohmann::json> root;   // Ownership of the JSON data
    const nlohmann::json* node;             // Pointer to the current node within root

    Impl();
    Impl(std::shared_ptr<nlohmann::json> r, const nlohmann::json* n);

    // Convenience factory methods
    static std::shared_ptr<Impl> create(nlohmann::json json);
    static std::shared_ptr<Impl> create(const std::string& value);
    static std::shared_ptr<Impl> create(const char* value);
    static std::shared_ptr<Impl> create(int value);
    static std::shared_ptr<Impl> create(double value);
    static std::shared_ptr<Impl> create(bool value);
    static std::shared_ptr<Impl> createObject();
    static std::shared_ptr<Impl> createArray();
    static std::shared_ptr<Impl> parse(const std::string& jsonStr);

    // Internal mutation — only valid on Impl instances created by createObject() / createArray()
    void set(const std::string& key, const SerializableData& value);
    void set(const std::string& key, const std::string& value);
    void set(const std::string& key, const char* value);
    void set(const std::string& key, int value);
    void set(const std::string& key, double value);
    void set(const std::string& key, bool value);
    void append(const SerializableData& value);
};

// IterImpl: internal iterator storage
struct SerializableData::ConstIterator::IterImpl {
    std::shared_ptr<nlohmann::json> root;   // Shared root to extend lifetime
    nlohmann::json::const_iterator it;
    nlohmann::json::const_iterator end;
    bool isObject;
    size_t index;

    IterImpl(std::shared_ptr<nlohmann::json> r, nlohmann::json::const_iterator i, nlohmann::json::const_iterator e, bool obj);
};

} // namespace agenui
