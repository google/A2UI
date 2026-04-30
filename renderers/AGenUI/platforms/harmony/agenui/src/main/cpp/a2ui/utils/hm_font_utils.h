#pragma once

#include <algorithm>
#include <cctype>
#include <string>

namespace a2ui {

inline std::string trimFontToken(const std::string& value) {
    size_t start = 0;
    size_t end = value.size();
    while (start < end && std::isspace(static_cast<unsigned char>(value[start]))) {
        ++start;
    }
    while (end > start && std::isspace(static_cast<unsigned char>(value[end - 1]))) {
        --end;
    }
    return value.substr(start, end - start);
}

inline std::string stripFontQuotes(const std::string& value) {
    if (value.size() >= 2) {
        const char first = value.front();
        const char last = value.back();
        if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
            return value.substr(1, value.size() - 2);
        }
    }
    return value;
}

inline std::string toLowerAscii(std::string value) {
    std::transform(value.begin(), value.end(), value.begin(), [](unsigned char ch) {
        return static_cast<char>(std::tolower(ch));
    });
    return value;
}

inline const std::string& harmonyDefaultFontFamily() {
    static const std::string kDefaultFontFamily = "HarmonyOS Sans";
    return kDefaultFontFamily;
}

inline std::string normalizeHarmonyFontFamily(const std::string& rawFamily) {
    std::string family = trimFontToken(stripFontQuotes(trimFontToken(rawFamily)));
    if (family.empty()) {
        return harmonyDefaultFontFamily();
    }

    return harmonyDefaultFontFamily();
}

} // namespace a2ui
