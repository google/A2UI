#pragma once
#include <string>
#include <memory>
#include <vector>
#include <iterator>

namespace agenui {

class SerializableData {
public:
    // Forward declaration of Impl — the type name is visible externally but cannot be constructed (incomplete type)
    struct Impl;

    // Construction / destruction / copy / move
    SerializableData();
    ~SerializableData();
    SerializableData(const SerializableData& other);
    SerializableData& operator=(const SerializableData& other);
    SerializableData(SerializableData&& other);
    SerializableData& operator=(SerializableData&& other);

    // Internal construction entry — external code cannot use this due to incomplete Impl type
    explicit SerializableData(std::shared_ptr<Impl> impl);
    const std::shared_ptr<Impl>& getImpl() const;

    // Chained read-only access (null-safe propagation)
    SerializableData operator[](const std::string& key) const;
    SerializableData operator[](size_t index) const;

    // Typed accessors with default values
    std::string asString(const std::string& defaultValue = "") const;
    int asInt(int defaultValue = 0) const;
    double asDouble(double defaultValue = 0.0) const;
    bool asBool(bool defaultValue = false) const;

    // Type checks
    bool isNull() const;
    bool isValid() const;
    bool isBool() const;
    bool isNumber() const;
    bool isString() const;
    bool isObject() const;
    bool isArray() const;

    // Container operations
    bool contains(const std::string& key) const;
    size_t size() const;
    bool empty() const;
    std::vector<std::string> getKeys() const;

    // Serialization
    std::string dump() const;

    // Public factory method
    static SerializableData parse(const std::string& jsonStr);

    // Const iterator (modeled after nlohmann::json)
    class ConstIterator;
    using const_iterator = ConstIterator;
    const_iterator begin() const;
    const_iterator end() const;

    // Comparison operators (for use in map and similar containers)
    bool operator==(const SerializableData& other) const;
    bool operator!=(const SerializableData& other) const;

private:
    std::shared_ptr<Impl> _impl;
};

// ConstIterator declaration
class SerializableData::ConstIterator {
public:
    using iterator_category = std::forward_iterator_tag;
    using difference_type = std::ptrdiff_t;

    ConstIterator();
    ~ConstIterator();
    ConstIterator(const ConstIterator& other);
    ConstIterator& operator=(const ConstIterator& other);
    ConstIterator(ConstIterator&& other);
    ConstIterator& operator=(ConstIterator&& other);

    SerializableData operator*() const;
    ConstIterator& operator++();
    ConstIterator operator++(int);
    bool operator==(const ConstIterator& other) const;
    bool operator!=(const ConstIterator& other) const;

    // nlohmann::json-style accessors
    std::string key() const;
    SerializableData value() const;

private:
    struct IterImpl;
    IterImpl* _impl = nullptr;
    friend class SerializableData;
};

} // namespace agenui
