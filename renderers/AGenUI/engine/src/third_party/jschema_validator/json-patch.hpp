#pragma once

#include "nlohmann/json.hpp"
#include <string>

namespace nlohmann
{
class JsonPatchFormatException : public std::exception
{
public:
	explicit JsonPatchFormatException(std::string msg)
	    : ex_{std::move(msg)} {}

	inline const char *what() const noexcept override final { return ex_.c_str(); }

private:
	std::string ex_;
};

class json_patch
{
public:
	json_patch() = default;
	json_patch(json &&patch);
	json_patch(const json &patch);

	json_patch &add(const json::json_pointer &, json value);
	json_patch &replace(const json::json_pointer &, json value);
	json_patch &remove(const json::json_pointer &);

	json &get_json() { return j_; }
	const json &get_json() const { return j_; }

	operator json() const { return j_; }

private:
	json j_ = nlohmann::json::array();

	static void validateJsonPatch(json const &patch);
};
} // namespace nlohmann
