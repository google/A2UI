#include "agenui_protocol_stream_extractor.h"
#include "agenui_stream_plugin_interface.h"
#include "agenui_log.h"

namespace agenui {

void ProtocolStreamExtractor::setPlugin(IStreamPlugin* plugin) {
    _plugin = plugin;
}

static constexpr size_t MAX_BUFFER_BYTES = 10 * 1024 * 1024; // 10 MB

void ProtocolStreamExtractor::appendData(const std::string& data) {
    if (_dataBuffer.size() + data.size() > MAX_BUFFER_BYTES) {
        AGENUI_LOG("buffer overflow, dropping data (buffer=%zu + incoming=%zu > limit=%zu)",
            _dataBuffer.size(), data.size(), MAX_BUFFER_BYTES);
        return;
    }
    _dataBuffer += data;
}

std::vector<ProtocolStreamExtractor::ParseResult> ProtocolStreamExtractor::driveParser() {
    std::vector<ParseResult> results;

    if (_plugin) {
        if (_plugin->isComponentStreaming()) {
            size_t newPos = 0;
            bool still = _plugin->continueComponentStreaming(
                _dataBuffer, _surfaceId, _version, results, newPos);
            if (still) {
                return results;
            }
            _parsePosition = newPos;
        }
        if (_plugin->isDataModelStreaming()) {
            size_t endPos = 0;
            bool still = _plugin->continueDataModelStreaming(
                _dataBuffer, results, endPos);
            if (still) {
                return results;
            }
            _dataBuffer = (endPos < _dataBuffer.length())
                ? _dataBuffer.substr(endPos) : "";
        }
    }

    if (_streamState == StreamState::StreamingComponents) {
        AGENUI_LOG("In component streaming mode");
        processStreamingData(results);
    } else if (_streamState == StreamState::StreamingDataModel) {
        AGENUI_LOG("In DataModel streaming mode");
        processStreamingDataModel(results);
    } else {
        // Otherwise process all complete events in the buffer
        processAllCompleteEvents(results);
    }
    return results;
}

bool ProtocolStreamExtractor::hasUnprocessedData() const {
    return !_dataBuffer.empty();
}

void ProtocolStreamExtractor::reset() {
    _dataBuffer.clear();
    _parsePosition = 0;
    _streamState = StreamState::Idle;
    resetDataModelStreamState();
    if (_plugin) {
        _plugin->reset();
    }
}

// MARK: - State machine main loop

void ProtocolStreamExtractor::processAllCompleteEvents(std::vector<ParseResult>& outResults) {
    while (true) {
        std::string completeJson;
        size_t endPos = 0;
        if (!extractFirstCompleteJson(_dataBuffer, completeJson, endPos)) {
            // No complete JSON; check for a partial updateComponents event
            EventType partialEventType = detectEventType(_dataBuffer);

            // Enter streaming mode only when updateComponents is detected and not already streaming
            if (partialEventType == EventType::UpdateComponents && _streamState != StreamState::StreamingComponents) {
                bool streamRet = startStreamingComponents();
                if (!streamRet) {
                    break;
                }
                _streamState = StreamState::StreamingComponents;
                processStreamingData(outResults);

                if (_streamState == StreamState::StreamingComponents) {
                    break; // Data incomplete; wait for more
                }
                continue; // Continue processing remaining data
            }

            if (partialEventType != EventType::Unknown) {
                // Try DM streaming first (applicable when value is an object)
                if (partialEventType == EventType::UpdateDataModel &&
                    _streamState != StreamState::StreamingDataModel) {
                    if (startStreamingDataModel()) {
                        _streamState = StreamState::StreamingDataModel;
                        processStreamingDataModel(outResults);
                        if (_streamState == StreamState::StreamingDataModel) {
                            break;
                        }
                        continue;
                    }
                }

                // Fallback when DM streaming cannot be entered
                // When value is not an object (e.g. direct string binding) or not yet available, let the plugin try
                if (_plugin && partialEventType == EventType::UpdateDataModel) {
                    if (_plugin->handleIncompleteDataModel(_dataBuffer, outResults)) {
                        break; // Plugin takes over
                    }
                }
            }
            break;
        }

        EventType eventType = detectEventType(completeJson);

        if (eventType == EventType::Unknown) {
            _dataBuffer = _dataBuffer.substr(endPos);
            continue;
        }
        if (eventType == EventType::UpdateComponents) {
            std::string subsequentData;
            if (endPos < _dataBuffer.length()) {
                subsequentData = _dataBuffer.substr(endPos);
            }

            _dataBuffer = completeJson;

            startStreamingComponents();
            _streamState = StreamState::StreamingComponents;
            processStreamingData(outResults);

            // Restore subsequent data after streaming is done
            _dataBuffer = subsequentData;
            continue;
        }

        // For a complete updateDataModel, deliver it as a whole rather than field-by-field
        if (eventType == EventType::UpdateDataModel) {
            ParseResult result;
            result.type = ParseResult::Type::NormalEvent;
            result.eventType = eventType;
            result.eventJson = completeJson;
            outResults.emplace_back(std::move(result));
            if (endPos < _dataBuffer.length()) {
                _dataBuffer = _dataBuffer.substr(endPos);
                continue;
            } else {
                reset();
                break;
            }
        }

        // Handle createSurface, deleteSurface
        ParseResult result;
        result.type = ParseResult::Type::NormalEvent;
        result.eventType = eventType;
        result.eventJson = completeJson;
        outResults.emplace_back(std::move(result));

        if (endPos < _dataBuffer.length()) {
            _dataBuffer = _dataBuffer.substr(endPos);
        } else {
            reset();
            break;
        }
    }
}

void ProtocolStreamExtractor::processStreamingData(std::vector<ParseResult>& outResults) {
    std::string component;
    while (extractNextComponent(component)) {
        if (_plugin) {
            _plugin->onComponentExtracted(component);
        }

        ParseResult result;
        result.type = ParseResult::Type::ComponentUpdate;
        result.eventType = ProtocolStreamExtractor::EventType::UpdateComponents;
        result.componentJson = component;
        result.surfaceId = _surfaceId;
        result.version = _version;
        outResults.emplace_back(std::move(result));
    }

    if (_plugin &&
        _streamState == StreamState::StreamingComponents &&
        _parsePosition < _dataBuffer.length() &&
        _dataBuffer[_parsePosition] == '{') {
        if (_plugin->handleIncompleteComponent(
                _dataBuffer, _parsePosition,
                _surfaceId, _version, outResults)) {
            return; // Plugin takes over
        }
    }

    if (_streamState == StreamState::StreamingComponents) {
        while (_parsePosition < _dataBuffer.length()) {
            char c = _dataBuffer[_parsePosition];
            if (c != ' ' && c != '\n' && c != '\r' && c != '\t') {
                break;
            }
            _parsePosition++;
        }

        if (_parsePosition < _dataBuffer.length() && _dataBuffer[_parsePosition] == ']') {
            _parsePosition++;

            if (isUpdateComponentsComplete()) {
                std::string remainingData;
                if (_parsePosition < _dataBuffer.length()) {
                    remainingData = _dataBuffer.substr(_parsePosition);
                }

                _streamState = StreamState::Idle;
                _surfaceId.clear();
                _version.clear();
                _parsePosition = 0;
                _dataBuffer = remainingData;

                if (!remainingData.empty()) {
                    processAllCompleteEvents(outResults);
                }
            } else {
                // Array terminator ] found but two closing }} not yet present; wait for more data
                reset();
            }
        }
    }
}

bool ProtocolStreamExtractor::startStreamingComponents() {
    _surfaceId = extractSurfaceId(_dataBuffer);
    _version = extractVersion(_dataBuffer);
    if (_surfaceId.empty() || _version.empty()) {
        // surfaceId or version not yet available; data is incomplete
        return false;
    }
    size_t arrayStart = findComponentsArrayStart(_dataBuffer);
    if (arrayStart == std::string::npos) {
        return false;
    }

    _parsePosition = arrayStart;
    return true;
}

// MARK: - JSON parsing low-level methods

bool ProtocolStreamExtractor::extractFirstCompleteJson(const std::string& buffer, std::string& outJson, size_t& outEndPos) {
    if (buffer.empty()) {
        return false;
    }

    size_t startPos = 0;
    while (startPos < buffer.length()) {
        char c = buffer[startPos];
        if (c != ' ' && c != '\n' && c != '\r' && c != '\t' && c != '\"') {
            break;
        }
        startPos++;
    }

    // Skip leading ] and }}: these may be incomplete trailing tokens from a previous stream chunk
    // and do not affect component parsing in the current data.
    while (startPos < buffer.length()) {
        char c = buffer[startPos];
        if (c != ']' && c != '}') {
            break;
        }
        startPos++;
    }

    if (startPos >= buffer.length() || buffer[startPos] != '{') {
        return false;
    }

    size_t endPos = 0;
    if (isJsonObjectComplete(buffer, startPos, endPos)) {
        outJson = buffer.substr(startPos, endPos - startPos + 1);
        outEndPos = endPos + 1;
        return true;
    }

    return false;
}

bool ProtocolStreamExtractor::extractNextComponent(std::string& outComponent) {
    while (_parsePosition < _dataBuffer.length()) {
        char c = _dataBuffer[_parsePosition];
        if (c != ' ' && c != '\n' && c != '\r' && c != '\t' && c != ',') {
            break;
        }
        _parsePosition++;
    }

    if (_parsePosition >= _dataBuffer.length()) {
        return false;
    }

    if (_dataBuffer[_parsePosition] == ']') {
        // Do not advance _parsePosition; let processStreamingData handle it
        return false;
    }

    if (_dataBuffer[_parsePosition] != '{') {
        return false;
    }

    size_t endPos = 0;
    if (isJsonObjectComplete(_dataBuffer, _parsePosition, endPos)) {
        outComponent = _dataBuffer.substr(_parsePosition, endPos - _parsePosition + 1);
        _parsePosition = endPos + 1;
        return true;
    }

    // JSON object is incomplete; wait for more data
    return false;
}

bool ProtocolStreamExtractor::isUpdateComponentsComplete() {
    size_t pos = _parsePosition;
    int braceCount = 0;

    while (pos < _dataBuffer.length()) {
        char c = _dataBuffer[pos];
        if (c != ' ' && c != '\n' && c != '\r' && c != '\t') {
            break;
        }
        pos++;
    }

    // Need two } to close the updateComponents object and the outer object:
    // { "version": "v0.9", "updateComponents": { "surfaceId": "xxx", "components": [...] } }
    //                                                                                    ^  ^
    //                                                                                    1  2
    while (pos < _dataBuffer.length() && braceCount < 2) {
        char c = _dataBuffer[pos];
        if (c == '}') {
            braceCount++;
            pos++;
            while (pos < _dataBuffer.length()) {
                char nextChar = _dataBuffer[pos];
                if (nextChar != ' ' && nextChar != '\n' && nextChar != '\r' && nextChar != '\t') {
                    break;
                }
                pos++;
            }
        } else if (c == ' ' || c == '\n' || c == '\r' || c == '\t') {
            pos++;
        } else {
            // Non-whitespace, non-} character encountered; unexpected format
            break;
        }
    }

    if (braceCount == 2) {
        _parsePosition = pos;
        return true;
    }

    return false;
}

bool ProtocolStreamExtractor::isJsonObjectComplete(const std::string& json, size_t startPos, size_t& endPos) {
    int depth = 0;
    bool inString = false;
    bool escaped = false;

    for (size_t i = startPos; i < json.length(); i++) {
        char c = json[i];

        if (escaped) {
            escaped = false;
            continue;
        }

        if (c == '\\') {
            escaped = true;
            continue;
        }

        if (c == '"') {
            inString = !inString;
            continue;
        }

        if (!inString) {
            if (c == '{') {
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 0) {
                    endPos = i;
                    return true;
                }
            }
        }
    }

    return false;
}

bool ProtocolStreamExtractor::isCompleteJson(const std::string& json) const {
    int braceDepth = 0;
    int bracketDepth = 0;
    bool inString = false;
    bool escaped = false;

    for (char c : json) {
        if (escaped) {
            escaped = false;
            continue;
        }

        if (c == '\\') {
            escaped = true;
            continue;
        }

        if (c == '"') {
            inString = !inString;
            continue;
        }

        if (!inString) {
            if (c == '{') braceDepth++;
            else if (c == '}') braceDepth--;
            else if (c == '[') bracketDepth++;
            else if (c == ']') bracketDepth--;
        }
    }

    return braceDepth == 0 && bracketDepth == 0 && !inString;
}

ProtocolStreamExtractor::EventType ProtocolStreamExtractor::detectEventType(const std::string& data) const {
    if (data.find("\"createSurface\"") != std::string::npos) {
        return EventType::CreateSurface;
    }
    if (data.find("\"updateComponents\"") != std::string::npos) {
        return EventType::UpdateComponents;
    }
    if (data.find("\"updateDataModel\"") != std::string::npos) {
        return EventType::UpdateDataModel;
    }
    if (data.find("\"appendDataModel\"") != std::string::npos) {
        return EventType::AppendDataModel;
    }
    if (data.find("\"deleteSurface\"") != std::string::npos) {
        return EventType::DeleteSurface;
    }
    return EventType::Unknown;
}

std::string ProtocolStreamExtractor::extractSurfaceId(const std::string& data) const {
    size_t pos = data.find("\"surfaceId\"");
    if (pos == std::string::npos) {
        return "";
    }

    pos = data.find("\"", pos + 11);
    if (pos == std::string::npos) {
        return "";
    }
    pos++;

    size_t endPos = data.find("\"", pos);
    if (endPos == std::string::npos) {
        return "";
    }

    return data.substr(pos, endPos - pos);
}

std::string ProtocolStreamExtractor::extractVersion(const std::string& data) const {
    size_t pos = data.find("\"version\"");
    if (pos == std::string::npos) {
        return "";
    }

    pos = data.find("\"", pos + 9);
    if (pos == std::string::npos) {
        return "";
    }
    pos++;

    size_t endPos = data.find("\"", pos);
    if (endPos == std::string::npos) {
        return "";
    }

    return data.substr(pos, endPos - pos);
}

size_t ProtocolStreamExtractor::findComponentsArrayStart(const std::string& data) const {
    size_t pos = data.find("\"components\"");
    if (pos == std::string::npos) {
        return std::string::npos;
    }

    pos = data.find("[", pos + 12);
    if (pos == std::string::npos) {
        return std::string::npos;
    }

    return pos + 1;
}

const char* ProtocolStreamExtractor::getEventTypeName(EventType type) const {
    if (type == EventType::CreateSurface) { return "createSurface"; }
    if (type == EventType::UpdateComponents) { return "updateComponents"; }
    if (type == EventType::UpdateDataModel) { return "updateDataModel"; }
    if (type == EventType::AppendDataModel) { return "appendDataModel"; }
    if (type == EventType::DeleteSurface) { return "deleteSurface"; }
    return "unknown";
}

// MARK: - DataModel streaming helpers

bool ProtocolStreamExtractor::isJsonArrayComplete(const std::string& json, size_t startPos, size_t& endPos) const {
    int depth = 0;
    bool inString = false;
    bool escaped = false;

    for (size_t i = startPos; i < json.length(); i++) {
        char c = json[i];

        if (escaped) {
            escaped = false;
            continue;
        }

        if (c == '\\') {
            escaped = true;
            continue;
        }

        if (c == '"') {
            inString = !inString;
            continue;
        }

        if (!inString) {
            if (c == '[') {
                depth++;
            } else if (c == ']') {
                depth--;
                if (depth == 0) {
                    endPos = i;
                    return true;
                }
            }
        }
    }

    return false;
}

bool ProtocolStreamExtractor::findClosingQuote(const std::string& buffer, size_t startPos, size_t& outEndPos) const {
    bool escaped = false;
    for (size_t i = startPos; i < buffer.length(); i++) {
        char c = buffer[i];
        if (escaped) {
            escaped = false;
            continue;
        }
        if (c == '\\') {
            escaped = true;
            continue;
        }
        if (c == '"') {
            if (isValidClosingQuote(buffer, i)) {
                outEndPos = i;
                return true;
            }
        }
    }
    return false;
}

bool ProtocolStreamExtractor::isValidClosingQuote(const std::string& buffer, size_t quotePos) const {
    size_t pos = quotePos + 1;
    while (pos < buffer.length()) {
        char c = buffer[pos];
        if (c != ' ' && c != '\t' && c != '\n' && c != '\r') {
            break;
        }
        pos++;
    }
    if (pos >= buffer.length()) {
        return true;
    }
    char nextChar = buffer[pos];
    return (nextChar == ',' || nextChar == ':' || nextChar == '}' || nextChar == ']' || nextChar == '\n' || nextChar == '\r');
}

std::string ProtocolStreamExtractor::removeInnerQuotes(const std::string& str) const {
    std::string result;
    size_t length = str.length();
    result.reserve(str.length());
    bool escaped = false;
    for (size_t i = 0; i < length; i++) {
        char c = str[i];
        if (escaped) {
            result += c;
            escaped = false;
            continue;
        }
        if (c == '\\') {
            result += c;
            escaped = true;
            continue;
        }
        // Remove only inner quotes; keep opening and closing quotes
        if (c == '"' && i != 0 && i != length - 1) {
            continue;
        }
        result += c;
    }
    return result;
}

bool ProtocolStreamExtractor::extractJsonStringAt(const std::string& buffer, size_t pos, std::string& outStr, size_t& outEndPos) const {
    if (pos >= buffer.length() || buffer[pos] != '"') {
        return false;
    }
    size_t closePos = 0;
    if (!findClosingQuote(buffer, pos + 1, closePos)) {
        return false;
    }
    outStr = buffer.substr(pos + 1, closePos - pos - 1);
    outEndPos = closePos;
    return true;
}

std::string ProtocolStreamExtractor::extractStringField(const std::string& data, const std::string& fieldName) const {
    std::string searchKey = "\"" + fieldName + "\"";
    size_t pos = data.find(searchKey);
    if (pos == std::string::npos) {
        return "";
    }

    pos += searchKey.length();
    while (pos < data.length() && (data[pos] == ' ' || data[pos] == '\t' || data[pos] == '\n' || data[pos] == '\r')) {
        pos++;
    }
    if (pos >= data.length() || data[pos] != ':') {
        return "";
    }
    pos++;
    while (pos < data.length() && (data[pos] == ' ' || data[pos] == '\t' || data[pos] == '\n' || data[pos] == '\r')) {
        pos++;
    }

    if (pos >= data.length() || data[pos] != '"') {
        return "";
    }
    pos++;
    size_t endPos = 0;
    if (!findClosingQuote(data, pos, endPos)) {
        return "";
    }
    return data.substr(pos, endPos - pos);
}

bool ProtocolStreamExtractor::extractCompleteJsonValue(const std::string& buffer, size_t startPos, size_t& outEndPos) const {
    if (startPos >= buffer.length()) {
        return false;
    }

    char c = buffer[startPos];

    if (c == '"') {
        return findClosingQuote(buffer, startPos + 1, outEndPos);
    }

    if (c == '{') {
        return isJsonObjectComplete(buffer, startPos, outEndPos);
    }

    if (c == '[') {
        return isJsonArrayComplete(buffer, startPos, outEndPos);
    }

    if (c == 't') {
        if (startPos + 3 < buffer.length() &&
            buffer[startPos + 1] == 'r' && buffer[startPos + 2] == 'u' && buffer[startPos + 3] == 'e') {
            outEndPos = startPos + 3;
            return true;
        }
        return false;
    }

    if (c == 'f') {
        if (startPos + 4 < buffer.length() &&
            buffer[startPos + 1] == 'a' && buffer[startPos + 2] == 'l' &&
            buffer[startPos + 3] == 's' && buffer[startPos + 4] == 'e') {
            outEndPos = startPos + 4;
            return true;
        }
        return false;
    }

    if (c == 'n') {
        if (startPos + 3 < buffer.length() &&
            buffer[startPos + 1] == 'u' && buffer[startPos + 2] == 'l' && buffer[startPos + 3] == 'l') {
            outEndPos = startPos + 3;
            return true;
        }
        return false;
    }

    if (c == '-' || (c >= '0' && c <= '9')) {
        size_t pos = startPos + 1;
        while (pos < buffer.length()) {
            char ch = buffer[pos];
            if ((ch >= '0' && ch <= '9') || ch == '.' || ch == 'e' || ch == 'E' || ch == '+' || ch == '-') {
                pos++;
            } else {
                outEndPos = pos - 1;
                return true;
            }
        }
        return false;
    }

    return false;
}

// MARK: - DataModel streaming core methods

void ProtocolStreamExtractor::emitDataModelUpdate(const std::string& surfaceId, const std::string& path,
                                                   const std::string& rawValue, std::vector<ParseResult>& outResults) {
    std::string eventJson = "{\"updateDataModel\":{";
    eventJson += "\"surfaceId\":\"" + surfaceId + "\",";
    eventJson += "\"path\":\"" + path + "\",";
    eventJson += "\"value\":" + rawValue;
    eventJson += "}}";

    ParseResult result;
    result.type = ParseResult::Type::NormalEvent;
    result.eventType = EventType::UpdateDataModel;
    result.eventJson = std::move(eventJson);
    outResults.emplace_back(std::move(result));
}

void ProtocolStreamExtractor::resetDataModelStreamState() {
    _dmSurfaceId.clear();
    _dmBasePath.clear();
    _dmParsePosition = 0;
    _dmValueStart = 0;
    _dmStack.clear();
    _dmMarkdownStreaming = false;
    _dmMarkdownFieldPath.clear();
    _dmMarkdownValueStart = 0;
    _dmMarkdownLastSentEnd = 0;
    _dmMarkdownFirstSent = false;
}

bool ProtocolStreamExtractor::startStreamingDataModel() {
    _dmSurfaceId = extractStringField(_dataBuffer, "surfaceId");
    if (_dmSurfaceId.empty()) {
        return false;
    }

    _dmBasePath = extractStringField(_dataBuffer, "path");
    if (_dmBasePath.empty()) {
        _dmBasePath = "/";
    }

    size_t pos = _dataBuffer.find("\"value\"");
    if (pos == std::string::npos) {
        return false;
    }
    pos += 7;

    while (pos < _dataBuffer.length() && (
        _dataBuffer[pos] == ' ' || _dataBuffer[pos] == '\t' ||
        _dataBuffer[pos] == '\n' || _dataBuffer[pos] == '\r')) {
        pos++;
    }

    if (pos >= _dataBuffer.length() || _dataBuffer[pos] != ':') {
        return false;
    }
    pos++;

    while (pos < _dataBuffer.length() && (
        _dataBuffer[pos] == ' ' || _dataBuffer[pos] == '\t' ||
        _dataBuffer[pos] == '\n' || _dataBuffer[pos] == '\r')) {
        pos++;
    }

    if (pos >= _dataBuffer.length()) {
        return false;
    }

    if (_dataBuffer[pos] == '{') {
        _dmValueStart = pos;
        _dmParsePosition = pos + 1;
        _dmStack.clear();
        _dmStack.push_back(DmStackEntry(DmStackEntry::Type::Object, _dmBasePath, 0));
        return true;
    }

    if (_dataBuffer[pos] == '[') {
        _dmValueStart = pos;
        _dmParsePosition = pos + 1;
        _dmStack.clear();
        _dmStack.push_back(DmStackEntry(DmStackEntry::Type::Array, _dmBasePath, 0));
        return true;
    }

    return false;
}

void ProtocolStreamExtractor::processStreamingDataModel(std::vector<ParseResult>& outResults) {
    while (true) {
        // If a Markdown field is currently being streamed, handle its continuation first
        if (_dmMarkdownStreaming) {
            if (!continueMarkdownFieldStreaming(outResults)) {
                return; // Still streaming; wait for more data
            }
            // Field complete; continue to the next field
            continue;
        }

        if (_dmStack.empty()) {
            handleDataModelComplete(outResults);
            return;
        }

        DmStackEntry::Type topType = _dmStack.back().type;
        std::string topPathPrefix = _dmStack.back().pathPrefix;

        if (topType == DmStackEntry::Type::Object) {
            // === Object mode: parse key-value pairs ===

            while (_dmParsePosition < _dataBuffer.length()) {
                char c = _dataBuffer[_dmParsePosition];
                if (c != ' ' && c != '\n' && c != '\r' && c != '\t' && c != ',') {
                    break;
                }
                _dmParsePosition++;
            }

            if (_dmParsePosition >= _dataBuffer.length()) {
                return;
            }

            if (_dataBuffer[_dmParsePosition] == '}') {
                _dmParsePosition++;
                _dmStack.pop_back();
                continue;
            }

            if (_dataBuffer[_dmParsePosition] != '"') {
                return;
            }
            std::string key;
            size_t keyEndPos = 0;
            if (!extractJsonStringAt(_dataBuffer, _dmParsePosition, key, keyEndPos)) {
                return;
            }
            size_t pos = keyEndPos + 1;

            while (pos < _dataBuffer.length() && (
                _dataBuffer[pos] == ' ' || _dataBuffer[pos] == '\t' ||
                _dataBuffer[pos] == '\n' || _dataBuffer[pos] == '\r')) {
                pos++;
            }

            if (pos >= _dataBuffer.length() || _dataBuffer[pos] != ':') {
                return;
            }
            pos++;

            while (pos < _dataBuffer.length() && (
                _dataBuffer[pos] == ' ' || _dataBuffer[pos] == '\t' ||
                _dataBuffer[pos] == '\n' || _dataBuffer[pos] == '\r')) {
                pos++;
            }

            if (pos >= _dataBuffer.length()) {
                return;
            }

            std::string fieldPath;
            if (!topPathPrefix.empty()) {
                if (topPathPrefix[topPathPrefix.size() - 1] == '/') {
                    fieldPath = topPathPrefix + key;
                } else {
                    fieldPath = topPathPrefix + "/" + key;
                }
            }

            char c = _dataBuffer[pos];

            if (c == '{') {
                _dmParsePosition = pos + 1;
                _dmStack.push_back(DmStackEntry(DmStackEntry::Type::Object, fieldPath, 0));
                continue;
            }

            if (c == '[') {
                _dmParsePosition = pos + 1;
                _dmStack.push_back(DmStackEntry(DmStackEntry::Type::Array, fieldPath, 0));
                continue;
            }

            // For string values, check whether this is a streaming binding path
            if (c == '"' && _plugin && _plugin->shouldStreamField(fieldPath)) {
                _dmParsePosition = pos;
                startMarkdownFieldStreaming(fieldPath, pos, outResults);
                if (_dmMarkdownStreaming) {
                    return; // Incremental streaming started; wait for more data
                }
                // String was complete; already emitted and _dmParsePosition advanced
                continue;
            }

            size_t valueEndPos = 0;
            if (!extractCompleteJsonValue(_dataBuffer, pos, valueEndPos)) {
                return;
            }
            std::string rawValue = _dataBuffer.substr(pos, valueEndPos - pos + 1);
            std::string outValue = removeInnerQuotes(rawValue);
            emitDataModelUpdate(_dmSurfaceId, fieldPath, outValue, outResults);
            _dmParsePosition = valueEndPos + 1;
            continue;

        } else {
            // === Array mode: recursively traverse elements (supports nested objects/arrays) ===

            while (_dmParsePosition < _dataBuffer.length()) {
                char c = _dataBuffer[_dmParsePosition];
                if (c != ' ' && c != '\n' && c != '\r' && c != '\t' && c != ',') {
                    break;
                }
                _dmParsePosition++;
            }

            if (_dmParsePosition >= _dataBuffer.length()) {
                return;
            }

            if (_dataBuffer[_dmParsePosition] == ']') {
                _dmParsePosition++;
                _dmStack.pop_back();
                continue;
            }

            int currentIndex = _dmStack.back().arrayIndex;
            std::string elementPath = topPathPrefix + "/" + std::to_string(currentIndex);

            char c = _dataBuffer[_dmParsePosition];

            if (c == '{') {
                _dmStack.back().arrayIndex++;
                _dmParsePosition++;
                _dmStack.push_back(DmStackEntry(DmStackEntry::Type::Object, elementPath, 0));
                continue;
            }

            if (c == '[') {
                _dmStack.back().arrayIndex++;
                _dmParsePosition++;
                _dmStack.push_back(DmStackEntry(DmStackEntry::Type::Array, elementPath, 0));
                continue;
            }

            // For string values, check whether this is a streaming binding path
            if (c == '"' && _plugin && _plugin->shouldStreamField(elementPath)) {
                _dmStack.back().arrayIndex++;
                startMarkdownFieldStreaming(elementPath, _dmParsePosition, outResults);
                if (_dmMarkdownStreaming) {
                    return; // Incremental streaming started; wait for more data
                }
                continue;
            }

            // Atomic value: extract and send as a whole
            size_t valueEndPos = 0;
            if (!extractCompleteJsonValue(_dataBuffer, _dmParsePosition, valueEndPos)) {
                return;
            }
            std::string rawValue = _dataBuffer.substr(_dmParsePosition, valueEndPos - _dmParsePosition + 1);
            emitDataModelUpdate(_dmSurfaceId, elementPath, rawValue, outResults);
            _dmStack.back().arrayIndex++;
            _dmParsePosition = valueEndPos + 1;
            continue;
        }
    }
}

void ProtocolStreamExtractor::handleDataModelComplete(std::vector<ParseResult>& outResults) {
    if (isDataModelEventComplete()) {
        std::string remainingData;
        if (_dmParsePosition < _dataBuffer.length()) {
            remainingData = _dataBuffer.substr(_dmParsePosition);
        }

        resetDataModelStreamState();
        _streamState = StreamState::Idle;
        _dataBuffer = remainingData;

        if (!remainingData.empty()) {
            processAllCompleteEvents(outResults);
        }
    } else {
        reset();
    }
}

bool ProtocolStreamExtractor::isDataModelEventComplete() {
    size_t pos = _dmParsePosition;
    int braceCount = 0;

    while (pos < _dataBuffer.length() && braceCount < 2) {
        char c = _dataBuffer[pos];
        if (c == '}') {
            braceCount++;
            pos++;
            while (pos < _dataBuffer.length()) {
                char nextChar = _dataBuffer[pos];
                if (nextChar != ' ' && nextChar != '\n' && nextChar != '\r' && nextChar != '\t') {
                    break;
                }
                pos++;
            }
        } else if (c == ' ' || c == '\n' || c == '\r' || c == '\t') {
            pos++;
        } else {
            break;
        }
    }

    if (braceCount == 2) {
        _dmParsePosition = pos;
        return true;
    }

    return false;
}

// MARK: - Field-level incremental streaming (sub-process embedded in DM streaming)

size_t ProtocolStreamExtractor::computeSafeEnd(size_t fromPos) const {
    size_t end = _dataBuffer.length();
    if (end <= fromPos) {
        return end;
    }
    size_t trailingBackslashes = 0;
    for (size_t i = end; i > fromPos; ) {
        i--;
        if (_dataBuffer[i] == '\\') {
            trailingBackslashes++;
        } else {
            break;
        }
    }
    // An odd number of trailing backslashes means the last \ is escaping the next character (not yet arrived); step back by 1
    if (trailingBackslashes % 2 != 0) {
        return end - 1;
    }
    return end;
}

void ProtocolStreamExtractor::emitAppendDataModel(const std::string& surfaceId, const std::string& path,
                                                    const std::string& delta, std::vector<ParseResult>& outResults) {
    std::string eventJson = "{\"appendDataModel\":{";
    eventJson += "\"surfaceId\":\"" + surfaceId + "\",";
    eventJson += "\"path\":\"" + path + "\",";
    eventJson += "\"value\":\"" + delta + "\"";
    eventJson += "}}";

    ParseResult result;
    result.type = ParseResult::Type::NormalEvent;
    result.eventType = EventType::AppendDataModel;
    result.eventJson = std::move(eventJson);
    outResults.emplace_back(std::move(result));
}

void ProtocolStreamExtractor::startMarkdownFieldStreaming(const std::string& fieldPath, size_t valueQuotePos,
                                                           std::vector<ParseResult>& outResults) {
    size_t contentStart = valueQuotePos + 1; // After the opening "

    size_t closePos = 0;
    if (findClosingQuote(_dataBuffer, contentStart, closePos)) {
        // String is complete; send it as a regular field (complete JSON string value with quotes)
        std::string rawValue = _dataBuffer.substr(valueQuotePos, closePos - valueQuotePos + 1);
        emitDataModelUpdate(_dmSurfaceId, fieldPath, rawValue, outResults);
        _dmParsePosition = closePos + 1;
        // _dmMarkdownStreaming remains false
        return;
    }

    // String is incomplete; enter field-level incremental streaming
    _dmMarkdownStreaming = true;
    _dmMarkdownFieldPath = fieldPath;
    _dmMarkdownValueStart = contentStart;
    _dmMarkdownFirstSent = false;

    size_t safeEnd = computeSafeEnd(contentStart);
    if (safeEnd > contentStart) {
        std::string partialContent = _dataBuffer.substr(contentStart, safeEnd - contentStart);
        // Send the first updateDataModel with a quoted partial string value
        std::string quotedValue = "\"" + partialContent + "\"";
        emitDataModelUpdate(_dmSurfaceId, fieldPath, quotedValue, outResults);
        _dmMarkdownFirstSent = true;
        _dmMarkdownLastSentEnd = safeEnd;
    } else {
        // No content after the opening quote yet; record the position and wait
        _dmMarkdownLastSentEnd = contentStart;
    }
}

bool ProtocolStreamExtractor::continueMarkdownFieldStreaming(std::vector<ParseResult>& outResults) {
    size_t closePos = 0;
    if (findClosingQuote(_dataBuffer, _dmMarkdownValueStart, closePos)) {
        // String is complete
        if (closePos > _dmMarkdownLastSentEnd) {
            std::string delta = _dataBuffer.substr(_dmMarkdownLastSentEnd, closePos - _dmMarkdownLastSentEnd);
            if (!delta.empty()) {
                if (!_dmMarkdownFirstSent) {
                    // First send (no prior content available); use updateDataModel
                    std::string quotedValue = "\"" + delta + "\"";
                    emitDataModelUpdate(_dmSurfaceId, _dmMarkdownFieldPath, quotedValue, outResults);
                } else {
                    emitAppendDataModel(_dmSurfaceId, _dmMarkdownFieldPath, delta, outResults);
                }
            }
        }

        _dmParsePosition = closePos + 1;
        _dmMarkdownStreaming = false;
        return true; // Field complete
    }

    // String is still incomplete; extract delta
    size_t safeEnd = computeSafeEnd(_dmMarkdownLastSentEnd);
    if (safeEnd > _dmMarkdownLastSentEnd) {
        std::string delta = _dataBuffer.substr(_dmMarkdownLastSentEnd, safeEnd - _dmMarkdownLastSentEnd);
        if (!delta.empty()) {
            if (!_dmMarkdownFirstSent) {
                // First send; use updateDataModel
                std::string quotedValue = "\"" + delta + "\"";
                emitDataModelUpdate(_dmSurfaceId, _dmMarkdownFieldPath, quotedValue, outResults);
                _dmMarkdownFirstSent = true;
            } else {
                emitAppendDataModel(_dmSurfaceId, _dmMarkdownFieldPath, delta, outResults);
            }
            _dmMarkdownLastSentEnd = safeEnd;
        }
    }

    return false; // Still streaming
}

} // namespace agenui
