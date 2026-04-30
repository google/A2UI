#include "agenui_serializable_data_impl.h"
#include "agenui_type_define.h"
#include "nlohmann/json.hpp"

namespace agenui {

// ---- Impl method implementations ----

SerializableData::Impl::Impl()
    : root(std::make_shared<nlohmann::json>(nullptr)), node(root.get()) {
}

SerializableData::Impl::Impl(std::shared_ptr<nlohmann::json> r, const nlohmann::json* n)
    : root(std::move(r)), node(n) {
}

std::shared_ptr<SerializableData::Impl> SerializableData::Impl::create(nlohmann::json json) {
    auto r = std::make_shared<nlohmann::json>(std::move(json));
    return std::make_shared<Impl>(r, r.get());
}

std::shared_ptr<SerializableData::Impl> SerializableData::Impl::create(const std::string& value) {
    return create(nlohmann::json(value));
}

std::shared_ptr<SerializableData::Impl> SerializableData::Impl::create(const char* value) {
    return create(nlohmann::json(value));
}

std::shared_ptr<SerializableData::Impl> SerializableData::Impl::create(int value) {
    return create(nlohmann::json(value));
}

std::shared_ptr<SerializableData::Impl> SerializableData::Impl::create(double value) {
    return create(nlohmann::json(value));
}

std::shared_ptr<SerializableData::Impl> SerializableData::Impl::create(bool value) {
    return create(nlohmann::json(value));
}

std::shared_ptr<SerializableData::Impl> SerializableData::Impl::createObject() {
    return create(nlohmann::json::object());
}

std::shared_ptr<SerializableData::Impl> SerializableData::Impl::createArray() {
    return create(nlohmann::json::array());
}

std::shared_ptr<SerializableData::Impl> SerializableData::Impl::parse(const std::string& jsonStr) {
    auto json = nlohmann::json::parse(jsonStr, nullptr, false);
    if (json.is_discarded()) {
        return nullptr;
    }
    return create(std::move(json));
}

void SerializableData::Impl::set(const std::string& key, const SerializableData& value) {
    if (value.getImpl() && value.getImpl()->node) {
        (*root)[key] = *value.getImpl()->node;
    } else {
        (*root)[key] = nullptr;
    }
}

void SerializableData::Impl::set(const std::string& key, const std::string& value) {
    (*root)[key] = value;
}

void SerializableData::Impl::set(const std::string& key, const char* value) {
    (*root)[key] = value;
}

void SerializableData::Impl::set(const std::string& key, int value) {
    (*root)[key] = value;
}

void SerializableData::Impl::set(const std::string& key, double value) {
    (*root)[key] = value;
}

void SerializableData::Impl::set(const std::string& key, bool value) {
    (*root)[key] = value;
}

void SerializableData::Impl::append(const SerializableData& value) {
    if (value.getImpl() && value.getImpl()->node) {
        root->push_back(*value.getImpl()->node);
    } else {
        root->push_back(nullptr);
    }
}

// ---- SerializableData construction / destruction / copy / move ----

SerializableData::SerializableData() : _impl(nullptr) {
}

SerializableData::~SerializableData() {
}

SerializableData::SerializableData(const SerializableData& other) : _impl(other._impl) {
}

SerializableData& SerializableData::operator=(const SerializableData& other) {
    if (this != &other) {
        _impl = other._impl;
    }
    return *this;
}

SerializableData::SerializableData(SerializableData&& other) : _impl(std::move(other._impl)) {
}

SerializableData& SerializableData::operator=(SerializableData&& other) {
    if (this != &other) {
        _impl = std::move(other._impl);
    }
    return *this;
}

SerializableData::SerializableData(std::shared_ptr<Impl> impl) : _impl(std::move(impl)) {
}

const std::shared_ptr<SerializableData::Impl>& SerializableData::getImpl() const {
    return _impl;
}

// ---- operator[] ----

SerializableData SerializableData::operator[](const std::string& key) const {
    if (!_impl || !_impl->node || !_impl->node->is_object() || !_impl->node->contains(key)) {
        return SerializableData();
    }
    return SerializableData(std::make_shared<Impl>(_impl->root, &((*_impl->node)[key])));
}

SerializableData SerializableData::operator[](size_t index) const {
    if (!_impl || !_impl->node || !_impl->node->is_array() || index >= _impl->node->size()) {
        return SerializableData();
    }
    return SerializableData(std::make_shared<Impl>(_impl->root, &((*_impl->node)[index])));
}

// ---- Typed accessors ----

std::string SerializableData::asString(const std::string& defaultValue) const {
    if (!_impl || !_impl->node || !_impl->node->is_string()) {
        return defaultValue;
    }
    return _impl->node->get<std::string>();
}

int SerializableData::asInt(int defaultValue) const {
    if (!_impl || !_impl->node || !_impl->node->is_number()) {
        return defaultValue;
    }
    return _impl->node->get<int>();
}

double SerializableData::asDouble(double defaultValue) const {
    if (!_impl || !_impl->node || !_impl->node->is_number()) {
        return defaultValue;
    }
    return _impl->node->get<double>();
}

bool SerializableData::asBool(bool defaultValue) const {
    if (!_impl || !_impl->node || !_impl->node->is_boolean()) {
        return defaultValue;
    }
    return _impl->node->get<bool>();
}

// ---- Type check methods ----

bool SerializableData::isNull() const {
    return !_impl || !_impl->node || _impl->node->is_null();
}

bool SerializableData::isValid() const {
    return _impl && _impl->node && !_impl->node->is_null();
}

bool SerializableData::isBool() const {
    return _impl && _impl->node && _impl->node->is_boolean();
}

bool SerializableData::isNumber() const {
    return _impl && _impl->node && _impl->node->is_number();
}

bool SerializableData::isString() const {
    return _impl && _impl->node && _impl->node->is_string();
}

bool SerializableData::isObject() const {
    return _impl && _impl->node && _impl->node->is_object();
}

bool SerializableData::isArray() const {
    return _impl && _impl->node && _impl->node->is_array();
}

// ---- Container operations ----

bool SerializableData::contains(const std::string& key) const {
    return _impl && _impl->node && _impl->node->is_object() && _impl->node->contains(key);
}

size_t SerializableData::size() const {
    if (_impl && _impl->node && (_impl->node->is_object() || _impl->node->is_array())) {
        return _impl->node->size();
    }
    return 0;
}

bool SerializableData::empty() const {
    return size() == 0;
}

std::vector<std::string> SerializableData::getKeys() const {
    std::vector<std::string> keys;
    if (_impl && _impl->node && _impl->node->is_object()) {
        keys.reserve(_impl->node->size());
        for (auto it = _impl->node->begin(); it != _impl->node->end(); ++it) {
            keys.emplace_back(it.key());
        }
    }
    return keys;
}

// ---- Serialization ----

std::string SerializableData::dump() const {
    if (!_impl || !_impl->node) {
        return "null";
    }
    return _impl->node->dump();
}

SerializableData SerializableData::parse(const std::string& jsonStr) {
    return SerializableData(Impl::parse(jsonStr));
}

// ---- Comparison operators ----

bool SerializableData::operator==(const SerializableData& other) const {
    if (!isValid() && !other.isValid()) {
        return true;
    }
    if (isValid() != other.isValid()) {
        return false;
    }
    return *_impl->node == *other._impl->node;
}

bool SerializableData::operator!=(const SerializableData& other) const {
    return !(*this == other);
}

// ---- IterImpl constructor ----

SerializableData::ConstIterator::IterImpl::IterImpl(
    std::shared_ptr<nlohmann::json> r,
    nlohmann::json::const_iterator i,
    nlohmann::json::const_iterator e,
    bool obj)
    : root(std::move(r)), it(std::move(i)), end(std::move(e)), isObject(obj), index(0) {
}

// ---- ConstIterator method implementations ----

SerializableData::ConstIterator::ConstIterator() : _impl(nullptr) {
}

SerializableData::ConstIterator::~ConstIterator() {
    SAFELY_DELETE(_impl);
}

SerializableData::ConstIterator::ConstIterator(const ConstIterator& other)
    : _impl(other._impl ? new IterImpl(other._impl->root, other._impl->it, other._impl->end, other._impl->isObject) : nullptr) {
    if (_impl && other._impl) {
        _impl->index = other._impl->index;
    }
}

SerializableData::ConstIterator& SerializableData::ConstIterator::operator=(const ConstIterator& other) {
    if (this != &other) {
        SAFELY_DELETE(_impl);
        if (other._impl) {
            _impl = new IterImpl(other._impl->root, other._impl->it, other._impl->end, other._impl->isObject);
            _impl->index = other._impl->index;
        } else {
            _impl = nullptr;
        }
    }
    return *this;
}

SerializableData::ConstIterator::ConstIterator(ConstIterator&& other) : _impl(other._impl) {
    other._impl = nullptr;
}

SerializableData::ConstIterator& SerializableData::ConstIterator::operator=(ConstIterator&& other) {
    if (this != &other) {
        SAFELY_DELETE(_impl);
        _impl = other._impl;
        other._impl = nullptr;
    }
    return *this;
}

SerializableData SerializableData::ConstIterator::operator*() const {
    if (!_impl || _impl->it == _impl->end) {
        return SerializableData();
    }
    return SerializableData(std::make_shared<Impl>(_impl->root, &(*_impl->it)));
}

SerializableData::ConstIterator& SerializableData::ConstIterator::operator++() {
    if (_impl) {
        ++_impl->it;
        ++_impl->index;
    }
    return *this;
}

SerializableData::ConstIterator SerializableData::ConstIterator::operator++(int) {
    ConstIterator tmp(*this);
    ++(*this);
    return tmp;
}

bool SerializableData::ConstIterator::operator==(const ConstIterator& other) const {
    bool thisEnd = !_impl || _impl->it == _impl->end;
    bool otherEnd = !other._impl || other._impl->it == other._impl->end;
    if (thisEnd && otherEnd) {
        return true;
    }
    if (thisEnd || otherEnd) {
        return false;
    }
    return _impl->it == other._impl->it;
}

bool SerializableData::ConstIterator::operator!=(const ConstIterator& other) const {
    return !(*this == other);
}

std::string SerializableData::ConstIterator::key() const {
    if (!_impl || _impl->it == _impl->end) {
        return "";
    }
    if (_impl->isObject) {
        return _impl->it.key();
    }
    return std::to_string(_impl->index);
}

SerializableData SerializableData::ConstIterator::value() const {
    return operator*();
}

// ---- begin() / end() ----

SerializableData::const_iterator SerializableData::begin() const {
    if (!_impl || !_impl->node) {
        return ConstIterator();
    }
    if (_impl->node->is_object() || _impl->node->is_array()) {
        auto* iterImpl = new ConstIterator::IterImpl(
            _impl->root, _impl->node->begin(), _impl->node->end(), _impl->node->is_object());
        ConstIterator it;
        it._impl = iterImpl;
        return it;
    }
    return ConstIterator();
}

SerializableData::const_iterator SerializableData::end() const {
    return ConstIterator();
}

} // namespace agenui
