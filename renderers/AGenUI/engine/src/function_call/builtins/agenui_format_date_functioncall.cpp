#include "agenui_format_date_functioncall.h"
#include <ctime>
#include <sstream>
#include <iomanip>
#include <regex>

namespace agenui {

namespace {
    // Parse an ISO 8601 date string into time_t
    std::time_t parseISO8601(const std::string& dateStr) {
        std::tm tm = {};
        std::istringstream ss(dateStr);

        // Try ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ
        ss >> std::get_time(&tm, "%Y-%m-%dT%H:%M:%S");

        if (ss.fail()) {
            // Fall back to simple date format: YYYY-MM-DD
            ss.clear();
            ss.str(dateStr);
            ss >> std::get_time(&tm, "%Y-%m-%d");
        }
        
        return std::mktime(&tm);
    }
    
    // Get month name
    const char* getMonthName(int month, bool abbreviated) {
        static const char* fullNames[] = {
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        };
        static const char* abbrevNames[] = {
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        };
        
        if (month < 0 || month > 11) return "";
        return abbreviated ? abbrevNames[month] : fullNames[month];
    }
    
    // Get weekday name
    const char* getWeekdayName(int weekday, bool abbreviated) {
        static const char* fullNames[] = {
            "Sunday", "Monday", "Tuesday", "Wednesday",
            "Thursday", "Friday", "Saturday"
        };
        static const char* abbrevNames[] = {
            "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
        };
        
        if (weekday < 0 || weekday > 6) return "";
        return abbreviated ? abbrevNames[weekday] : fullNames[weekday];
    }
    
    // Convert a TR35 format pattern to its formatted output
    std::string formatWithTR35(const std::tm& tm, const std::string& format) {
        std::string result;
        size_t i = 0;

        while (i < format.length()) {
            // Check if current character is a format token
            if (format[i] == 'y' || format[i] == 'M' || format[i] == 'd' ||
                format[i] == 'E' || format[i] == 'H' || format[i] == 'h' ||
                format[i] == 'm' || format[i] == 's' || format[i] == 'a') {
                
                char token = format[i];
                size_t count = 1;
                
                // Count consecutive identical characters
                while (i + count < format.length() && format[i + count] == token) {
                    count++;
                }
                
                std::ostringstream oss;
                
                switch (token) {
                    case 'y': // Year
                        if (count == 2) {
                            oss << std::setfill('0') << std::setw(2) << (tm.tm_year % 100);
                        } else {
                            oss << (1900 + tm.tm_year);
                        }
                        break;
                        
                    case 'M': // Month
                        if (count == 1) {
                            oss << (tm.tm_mon + 1);
                        } else if (count == 2) {
                            oss << std::setfill('0') << std::setw(2) << (tm.tm_mon + 1);
                        } else if (count == 3) {
                            oss << getMonthName(tm.tm_mon, true);
                        } else {
                            oss << getMonthName(tm.tm_mon, false);
                        }
                        break;
                        
                    case 'd': // Day
                        if (count == 1) {
                            oss << tm.tm_mday;
                        } else {
                            oss << std::setfill('0') << std::setw(2) << tm.tm_mday;
                        }
                        break;
                        
                    case 'E': // Weekday
                        if (count <= 3) {
                            oss << getWeekdayName(tm.tm_wday, true);
                        } else {
                            oss << getWeekdayName(tm.tm_wday, false);
                        }
                        break;
                        
                    case 'H': // 24-hour clock
                        if (count == 1) {
                            oss << tm.tm_hour;
                        } else {
                            oss << std::setfill('0') << std::setw(2) << tm.tm_hour;
                        }
                        break;
                        
                    case 'h': // 12-hour clock
                        {
                            int hour12 = tm.tm_hour % 12;
                            if (hour12 == 0) hour12 = 12;
                            if (count == 1) {
                                oss << hour12;
                            } else {
                                oss << std::setfill('0') << std::setw(2) << hour12;
                            }
                        }
                        break;
                        
                    case 'm': // Minute
                        oss << std::setfill('0') << std::setw(2) << tm.tm_min;
                        break;
                        
                    case 's': // Second
                        oss << std::setfill('0') << std::setw(2) << tm.tm_sec;
                        break;
                        
                    case 'a': // AM/PM
                        oss << (tm.tm_hour < 12 ? "AM" : "PM");
                        break;
                }
                
                result += oss.str();
                i += count;
            } else {
                result += format[i];
                i++;
            }
        }
        
        return result;
    }
}

FunctionCallResolution FormatDateFunctionCall::execute(const nlohmann::json& args) {
    if (!args.contains("value") || !args.contains("format")) {
        return FunctionCallResolution::createError("Missing required parameters");
    }
    
    if (!args["format"].is_string()) {
        return FunctionCallResolution::createError("Format must be a string");
    }
    
    std::string format = args["format"].get<std::string>();
    std::time_t timestamp;
    
    if (args["value"].is_string()) {
        // ISO 8601 string
        std::string dateStr = args["value"].get<std::string>();
        timestamp = parseISO8601(dateStr);

        if (timestamp == -1) {
            return FunctionCallResolution::createError("Invalid date string format");
        }
    } else if (args["value"].is_number()) {
        // Unix timestamp in milliseconds
        int64_t ms = args["value"].get<int64_t>();
        timestamp = static_cast<std::time_t>(ms / 1000);
    } else {
        return FunctionCallResolution::createError("Value must be a string or number");
    }
    
    std::tm* tm = std::localtime(&timestamp);
    if (!tm) {
        return FunctionCallResolution::createError("Failed to convert timestamp");
    }

    std::string result = formatWithTR35(*tm, format);
    
    return FunctionCallResolution::createSuccess(result);
}

FunctionCallConfig FormatDateFunctionCall::getConfig() const {
    FunctionCallConfig config;
    config.setName("formatDate");
    config.setDescription("Formats a timestamp into a string using a pattern.");
    config.setReturnType("string");
    config.setSync(true);
    nlohmann::json params = {
        {"type", "object"},
        {"properties", {
            {"value", {{"description", "The date to format."}}},
            {"format", {{"type", "string"}}}
        }},
        {"required", nlohmann::json::array({"value", "format"})}
    };
    config.setParameters(params);
    return config;
}

} // namespace agenui
