#include "agenui_markdown_stream_plugin.h"
#include "agenui_log.h"
#include <sstream>
#include "nlohmann/json.hpp"

namespace agenui {

// MARK: - IStreamPlugin interface

void MarkdownStreamPlugin::onComponentExtracted(const std::string& componentJson) {
    collectBindingPath(componentJson);
}

bool MarkdownStreamPlugin::handleIncompleteComponent(
    const std::string& buffer, size_t componentStartPos,
    const std::string& surfaceId, const std::string& version,
    std::vector<ProtocolStreamExtractor::ParseResult>& outResults) {

    // Condition 1: "component":"Markdown" has appeared
    if (!isPartialMarkdownComponent(buffer, componentStartPos)) {
        return false;
    }

    // Condition 2: "content":"... has appeared and the value string is not yet closed
    size_t contentStart = findInlineContentValueStart(buffer, componentStartPos);
    if (contentStart == std::string::npos) {
        // "content" not found, not yet arrived, or is a data binding {"path":"..."}
        return false;
    }

    // Check whether the content value is already closed (no streaming needed if so)
    size_t closePos = 0;
    if (isStringValueClosed(buffer, contentStart, closePos)) {
        // content value is complete; let the normal logic handle it
        return false;
    }

    // Enter Markdown component streaming mode
    _isComponentStreaming = true;
    _componentStart = componentStartPos;
    _contentValueStart = contentStart;

    // Cache the component id (raw JSON-encoded)
    _cachedComponentId = extractRawStringValue(buffer.substr(_componentStart), "\"id\"");

    // Deliver the first partial content immediately (using the content field)
    std::string partialJson = constructPartialJson(buffer, _componentStart, "\"}");
    if (!partialJson.empty()) {
        ProtocolStreamExtractor::ParseResult result;
        result.type = ProtocolStreamExtractor::ParseResult::Type::ComponentUpdate;
        result.componentJson = partialJson;
        result.surfaceId = surfaceId;
        result.version = version;
        outResults.emplace_back(std::move(result));
    }

    // Compute the end position of the sent content (accounting for trailing backslash trimming)
    size_t trailingBackslashes = 0;
    for (size_t i = buffer.length(); i > _contentValueStart; ) {
        i--;
        if (buffer[i] == '\\') {
            trailingBackslashes++;
        } else {
            break;
        }
    }
    _lastSentContentEnd = (trailingBackslashes % 2 != 0)
        ? buffer.length() - 1
        : buffer.length();

    return true; // Plugin takes over
}

bool MarkdownStreamPlugin::continueComponentStreaming(
    const std::string& buffer,
    const std::string& surfaceId, const std::string& version,
    std::vector<ProtocolStreamExtractor::ParseResult>& outResults,
    size_t& outParsePosition) {

    // 1. Check whether the component JSON is fully closed
    size_t endPos = 0;
    if (ProtocolStreamExtractor::isJsonObjectComplete(buffer, _componentStart, endPos)) {
        // Component is complete; extract it to collect binding paths
        std::string component = buffer.substr(_componentStart, endPos - _componentStart + 1);
        collectBindingPath(component);

        // Extract the content close position and compute the final delta
        size_t closePos = 0;
        if (isStringValueClosed(buffer, _contentValueStart, closePos)) {
            std::string delta = extractDelta(buffer, _lastSentContentEnd, closePos);
            if (!delta.empty()) {
                ProtocolStreamExtractor::ParseResult result;
                result.type = ProtocolStreamExtractor::ParseResult::Type::ComponentUpdate;
                result.componentJson = buildAppendContentJson(delta);
                result.surfaceId = surfaceId;
                result.version = version;
                outResults.emplace_back(std::move(result));
            }
        }

        outParsePosition = endPos + 1;
        _isComponentStreaming = false;

        return false; // Streaming complete
    }

    // 2. Check whether the content value is closed
    size_t closePos = 0;
    if (isStringValueClosed(buffer, _contentValueStart, closePos)) {
        // content value is closed; send the final delta and hand back to normal extraction
        std::string delta = extractDelta(buffer, _lastSentContentEnd, closePos);
        if (!delta.empty()) {
            ProtocolStreamExtractor::ParseResult result;
            result.type = ProtocolStreamExtractor::ParseResult::Type::ComponentUpdate;
            result.componentJson = buildAppendContentJson(delta);
            result.surfaceId = surfaceId;
            result.version = version;
            outResults.emplace_back(std::move(result));
        }

        outParsePosition = _componentStart;
        _isComponentStreaming = false;

        return false; // Streaming complete (component not yet closed; returned to normal logic)
    }

    // 3. content value is still growing; extract and deliver the delta
    std::string delta = extractDelta(buffer, _lastSentContentEnd, std::string::npos);
    if (delta.empty()) {
        return true; // No new data; skip this delivery
    }

    ProtocolStreamExtractor::ParseResult result;
    result.type = ProtocolStreamExtractor::ParseResult::Type::ComponentUpdate;
    result.componentJson = buildAppendContentJson(delta);
    result.surfaceId = surfaceId;
    result.version = version;
    outResults.emplace_back(std::move(result));

    // Update the sent position
    size_t trailingBackslashes = 0;
    for (size_t i = buffer.length(); i > _lastSentContentEnd; ) {
        i--;
        if (buffer[i] == '\\') {
            trailingBackslashes++;
        } else {
            break;
        }
    }
    _lastSentContentEnd = (trailingBackslashes % 2 != 0)
        ? buffer.length() - 1
        : buffer.length();

    return true; // Still streaming
}

bool MarkdownStreamPlugin::handleIncompleteDataModel(
    const std::string& buffer,
    std::vector<ProtocolStreamExtractor::ParseResult>& outResults) {

    // 1. Extract the event path
    std::string rawPath = extractStringValue(buffer, "\"path\"");
    std::string eventPath = normalizePath(rawPath);

    // 2. Extract surfaceId
    std::string surfaceId = extractStringValue(buffer, "\"surfaceId\"");

    // 3. Find all registered Markdown binding paths that match as a prefix
    std::vector<std::string> matchedBindings;
    for (const auto& bp : _markdownBindingPaths) {
        if (isPathPrefix(eventPath, bp)) {
            matchedBindings.push_back(bp);
        }
    }

    if (matchedBindings.empty()) {
        return false;
    }

    // 4. Navigate to the leaf string value for each matched binding path
    _streamingEntries.clear();
    for (const auto& bp : matchedBindings) {
        std::vector<std::string> segments = computeRelativeSegments(eventPath, bp);
        size_t leafStart = locateNestedStringValue(buffer, segments);
        if (leafStart == std::string::npos) {
            continue;
        }

        // Check whether the leaf value is already closed
        size_t closePos = 0;
        if (isStringValueClosed(buffer, leafStart, closePos)) {
            continue; // Already closed; no streaming needed
        }

        DataModelStreamingEntry entry;
        entry.bindingPath = bp;
        entry.eventPath = eventPath;
        entry.surfaceId = surfaceId;
        entry.leafValueStart = leafStart;
        entry.lastSentEnd = 0; // Will be updated after first send
        entry.firstEventSent = false;
        _streamingEntries.push_back(entry);
    }

    if (_streamingEntries.empty()) {
        return false;
    }

    // 5. Enter DataModel streaming mode
    _isDataModelStreaming = true;

    // 6. Send the first updateDataModel event for each entry (dispatched at binding-path level)
    for (auto& entry : _streamingEntries) {
        // Extract partial content of the leaf value from the current buffer
        std::string leafContent = extractDelta(buffer, entry.leafValueStart, std::string::npos);

        // Build event using the binding path (path points exactly to the leaf, e.g. "/flight/markdown1")
        std::string eventJson = buildDataModelEventJson(entry, leafContent, "updateDataModel");
        if (!eventJson.empty()) {
            ProtocolStreamExtractor::ParseResult result;
            result.type = ProtocolStreamExtractor::ParseResult::Type::NormalEvent;
            result.eventType = ProtocolStreamExtractor::EventType::UpdateDataModel;
            result.eventJson = eventJson;
            outResults.emplace_back(std::move(result));
            entry.firstEventSent = true;
        }

        // Compute the end position of the sent leaf value
        size_t trailingBackslashes = 0;
        for (size_t i = buffer.length(); i > entry.leafValueStart; ) {
            i--;
            if (buffer[i] == '\\') {
                trailingBackslashes++;
            } else {
                break;
            }
        }
        entry.lastSentEnd = (trailingBackslashes % 2 != 0)
            ? buffer.length() - 1
            : buffer.length();
    }

    return true; // Plugin takes over
}

bool MarkdownStreamPlugin::continueDataModelStreaming(
    const std::string& buffer,
    std::vector<ProtocolStreamExtractor::ParseResult>& outResults,
    size_t& outEndPosition) {

    // 1. Check whether the complete JSON is closed
    size_t jsonStart = 0;
    while (jsonStart < buffer.length()) {
        char c = buffer[jsonStart];
        if (c != ' ' && c != '\n' && c != '\r' && c != '\t') {
            break;
        }
        jsonStart++;
    }

    if (jsonStart < buffer.length() && buffer[jsonStart] == '{') {
        size_t endPos = 0;
        if (ProtocolStreamExtractor::isJsonObjectComplete(buffer, jsonStart, endPos)) {
            // JSON is complete; send the final appendDataModel delta for each entry
            for (auto& entry : _streamingEntries) {
                size_t closePos = 0;
                if (!isStringValueClosed(buffer, entry.leafValueStart, closePos)) {
                    continue;
                }
                std::string delta = extractDelta(buffer, entry.lastSentEnd, closePos);

                if (!delta.empty()) {
                    // Leaf has a delta; send only the leaf delta as appendDataModel
                    std::string eventJson = buildAppendDataModelJson(entry, delta);
                    if (!eventJson.empty()) {
                        ProtocolStreamExtractor::ParseResult result;
                        result.type = ProtocolStreamExtractor::ParseResult::Type::NormalEvent;
                        result.eventType = ProtocolStreamExtractor::EventType::AppendDataModel;
                        result.eventJson = eventJson;
                        outResults.emplace_back(std::move(result));
                    }
                }
            }

            // Build the set of actively streamed binding paths (before clearing entries)
            std::set<std::string> activeStreamingPaths;
            for (const auto& entry : _streamingEntries) {
                activeStreamingPaths.insert(entry.bindingPath);
            }

            // Parse the complete JSON and dispatch non-streaming leaf fields (one updateDataModel per leaf)
            {
                std::string eventJsonStr = buffer.substr(jsonStart, endPos - jsonStart + 1);
                nlohmann::json fullEvent = nlohmann::json::parse(eventJsonStr, nullptr, false);
                if (!fullEvent.is_discarded() && fullEvent.contains("updateDataModel")) {
                    auto& udm = fullEvent["updateDataModel"];
                    if (udm.contains("value") && udm.contains("surfaceId")) {
                        nlohmann::json value = udm["value"];
                        std::string surfaceId = udm["surfaceId"].get<std::string>();
                        std::string eventPath = udm.contains("path")
                            ? udm["path"].get<std::string>() : "/";
                        std::string basePath = (eventPath == "/") ? "" : eventPath;

                        dispatchLeafFieldEvents(value, surfaceId, basePath,
                                                activeStreamingPaths, outResults);
                    }
                }
            }

            outEndPosition = endPos + 1;
            _isDataModelStreaming = false;
            _streamingEntries.clear();
            return false; // Streaming complete
        }
    }

    // 2. JSON is not yet complete; extract and deliver the delta for each entry
    for (auto& entry : _streamingEntries) {
        // Check whether the leaf string is closed
        size_t closePos = 0;
        bool leafClosed = isStringValueClosed(buffer, entry.leafValueStart, closePos);

        std::string delta;
        if (leafClosed) {
            // Leaf string is closed; extract precisely up to closePos
            delta = extractDelta(buffer, entry.lastSentEnd, closePos);
            // Update sent position to closePos; no further extraction for this entry
            entry.lastSentEnd = closePos;
        } else {
            // Leaf string is still growing; extract to end of buffer
            delta = extractDelta(buffer, entry.lastSentEnd, std::string::npos);
            if (!delta.empty()) {
                // Update sent position
                size_t trailingBackslashes = 0;
                for (size_t i = buffer.length(); i > entry.lastSentEnd; ) {
                    i--;
                    if (buffer[i] == '\\') {
                        trailingBackslashes++;
                    } else {
                        break;
                    }
                }
                entry.lastSentEnd = (trailingBackslashes % 2 != 0)
                    ? buffer.length() - 1
                    : buffer.length();
            }
        }

        if (delta.empty()) {
            continue;
        }

        ProtocolStreamExtractor::ParseResult result;
        result.type = ProtocolStreamExtractor::ParseResult::Type::NormalEvent;
        result.eventType = ProtocolStreamExtractor::EventType::AppendDataModel;
        result.eventJson = buildAppendDataModelJson(entry, delta);
        outResults.emplace_back(std::move(result));
    }

    // 3. Detect newly appeared Markdown binding path leaf nodes (supports parallel streaming of multiple bindings)
    if (!_streamingEntries.empty()) {
        std::string eventPath = _streamingEntries[0].eventPath;
        std::string surfaceId = _streamingEntries[0].surfaceId;

        for (const auto& bp : _markdownBindingPaths) {
            // Check whether already tracked
            bool tracked = false;
            for (const auto& e : _streamingEntries) {
                if (e.bindingPath == bp) { tracked = true; break; }
            }
            if (tracked) continue;

            if (!isPathPrefix(eventPath, bp)) continue;

            std::vector<std::string> segments = computeRelativeSegments(eventPath, bp);
            size_t leafStart = locateNestedStringValue(buffer, segments);
            if (leafStart == std::string::npos) continue;

            // Leaf has appeared in the buffer; create a new streaming entry
            DataModelStreamingEntry newEntry;
            newEntry.bindingPath = bp;
            newEntry.eventPath = eventPath;
            newEntry.surfaceId = surfaceId;
            newEntry.leafValueStart = leafStart;
            newEntry.firstEventSent = false;

            size_t closePos = 0;
            bool leafClosed = isStringValueClosed(buffer, leafStart, closePos);

            std::string leafContent;
            if (leafClosed) {
                // Leaf is closed; extract full content
                leafContent = buffer.substr(leafStart, closePos - leafStart);
                newEntry.lastSentEnd = closePos;
            } else {
                // Leaf is not yet closed; extract to end of buffer
                leafContent = extractDelta(buffer, leafStart, std::string::npos);
                size_t trailingBackslashes = 0;
                for (size_t i = buffer.length(); i > leafStart; ) {
                    i--;
                    if (buffer[i] == '\\') { trailingBackslashes++; }
                    else { break; }
                }
                newEntry.lastSentEnd = (trailingBackslashes % 2 != 0)
                    ? buffer.length() - 1
                    : buffer.length();
            }

            // Send the first updateDataModel (containing only the leaf data for this binding path)
            if (!leafContent.empty() || leafClosed) {
                std::string eventJson = buildDataModelEventJson(newEntry, leafContent, "updateDataModel");
                if (!eventJson.empty()) {
                    ProtocolStreamExtractor::ParseResult result;
                    result.type = ProtocolStreamExtractor::ParseResult::Type::NormalEvent;
                    result.eventType = ProtocolStreamExtractor::EventType::UpdateDataModel;
                    result.eventJson = eventJson;
                    outResults.emplace_back(std::move(result));
                    newEntry.firstEventSent = true;
                }
            }

            _streamingEntries.push_back(newEntry);
        }
    }

    return true; // Still streaming
}

void MarkdownStreamPlugin::reset() {
    _isComponentStreaming = false;
    _isDataModelStreaming = false;
    _componentStart = 0;
    _contentValueStart = 0;
    _lastSentContentEnd = 0;
    _cachedComponentId.clear();
    _streamingEntries.clear();
    _markdownBindingPaths.clear();
}

bool MarkdownStreamPlugin::shouldStreamField(const std::string& fieldPath) const {
    return _markdownBindingPaths.count(fieldPath) > 0;
}

bool MarkdownStreamPlugin::isPartialMarkdownComponent(const std::string& buffer, size_t startPos) const {
    size_t compPos = buffer.find("\"component\"", startPos);
    if (compPos == std::string::npos) {
        return false;
    }

    size_t pos = compPos + 11; // strlen("\"component\"")
    while (pos < buffer.length() && (buffer[pos] == ' ' || buffer[pos] == '\t' ||
           buffer[pos] == '\n' || buffer[pos] == '\r')) {
        pos++;
    }
    if (pos >= buffer.length() || buffer[pos] != ':') {
        return false;
    }
    pos++;
    while (pos < buffer.length() && (buffer[pos] == ' ' || buffer[pos] == '\t' ||
           buffer[pos] == '\n' || buffer[pos] == '\r')) {
        pos++;
    }

    if (pos + 9 >= buffer.length()) { // strlen("\"Markdown\"") = 10
        return false;
    }
    return buffer.substr(pos, 10) == "\"Markdown\"";
}

size_t MarkdownStreamPlugin::findInlineContentValueStart(const std::string& buffer, size_t startPos) const {
    size_t keyPos = buffer.find("\"content\"", startPos);
    if (keyPos == std::string::npos) {
        return std::string::npos;
    }

    size_t pos = keyPos + 9; // strlen("\"content\"")
    while (pos < buffer.length() && (buffer[pos] == ' ' || buffer[pos] == '\t' ||
           buffer[pos] == '\n' || buffer[pos] == '\r')) {
        pos++;
    }
    if (pos >= buffer.length() || buffer[pos] != ':') {
        return std::string::npos;
    }
    pos++;
    while (pos < buffer.length() && (buffer[pos] == ' ' || buffer[pos] == '\t' ||
           buffer[pos] == '\n' || buffer[pos] == '\r')) {
        pos++;
    }

    if (pos >= buffer.length()) {
        return std::string::npos;
    }

    if (buffer[pos] == '"') {
        return pos + 1; // Inline string; return position after the opening "
    }
    if (buffer[pos] == '{') {
        return std::string::npos; // Data binding object
    }

    return std::string::npos;
}

bool MarkdownStreamPlugin::isStringValueClosed(const std::string& buffer, size_t valueStart, size_t& closePos) const {
    bool escaped = false;

    for (size_t i = valueStart; i < buffer.length(); i++) {
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
            closePos = i;
            return true;
        }
    }

    return false;
}

std::string MarkdownStreamPlugin::constructPartialJson(
    const std::string& data, size_t startPos, const std::string& suffix) const {
    if (startPos >= data.length()) {
        return "";
    }

    std::string partial = data.substr(startPos);

    // Handle incomplete trailing escape: if the string ends with an odd number of \, remove the last one
    size_t trailingBackslashes = 0;
    for (auto it = partial.rbegin(); it != partial.rend() && *it == '\\'; ++it) {
        trailingBackslashes++;
    }
    if (trailingBackslashes % 2 != 0) {
        partial.pop_back();
    }

    partial += suffix;
    return partial;
}

void MarkdownStreamPlugin::collectBindingPath(const std::string& componentJson) {
    if (componentJson.find("\"Markdown\"") == std::string::npos) {
        return;
    }
    if (!isPartialMarkdownComponent(componentJson, 0)) {
        return;
    }

    size_t keyPos = componentJson.find("\"content\"");
    if (keyPos == std::string::npos) {
        return;
    }

    size_t pos = keyPos + 9;
    while (pos < componentJson.length() && (componentJson[pos] == ' ' || componentJson[pos] == '\t' ||
           componentJson[pos] == '\n' || componentJson[pos] == '\r')) {
        pos++;
    }
    if (pos >= componentJson.length() || componentJson[pos] != ':') {
        return;
    }
    pos++;
    while (pos < componentJson.length() && (componentJson[pos] == ' ' || componentJson[pos] == '\t' ||
           componentJson[pos] == '\n' || componentJson[pos] == '\r')) {
        pos++;
    }

    // Check whether this is a data binding object {"path":"..."}
    if (pos >= componentJson.length() || componentJson[pos] != '{') {
        return; // Not an object; likely inline string; no path to record
    }

    std::string path = extractStringValue(componentJson.substr(pos), "\"path\"");
    if (!path.empty()) {
        _markdownBindingPaths.insert(path);
    }
}

std::string MarkdownStreamPlugin::extractStringValue(const std::string& buffer, const std::string& key) const {
    size_t keyPos = buffer.find(key);
    if (keyPos == std::string::npos) {
        return "";
    }

    size_t pos = keyPos + key.length();
    while (pos < buffer.length() && (buffer[pos] == ' ' || buffer[pos] == '\t' ||
           buffer[pos] == '\n' || buffer[pos] == '\r')) {
        pos++;
    }
    if (pos >= buffer.length() || buffer[pos] != ':') {
        return "";
    }
    pos++;
    while (pos < buffer.length() && (buffer[pos] == ' ' || buffer[pos] == '\t' ||
           buffer[pos] == '\n' || buffer[pos] == '\r')) {
        pos++;
    }

    if (pos >= buffer.length() || buffer[pos] != '"') {
        return "";
    }
    pos++; // Skip opening "

    std::string value;
    bool escaped = false;
    for (size_t i = pos; i < buffer.length(); i++) {
        char c = buffer[i];
        if (escaped) {
            value += c;
            escaped = false;
            continue;
        }
        if (c == '\\') {
            escaped = true;
            continue;
        }
        if (c == '"') {
            return value;
        }
        value += c;
    }

    return ""; // String not closed
}

size_t MarkdownStreamPlugin::findStringValueStart(const std::string& buffer, const std::string& key) const {
    size_t keyPos = buffer.find(key);
    if (keyPos == std::string::npos) {
        return std::string::npos;
    }

    size_t pos = keyPos + key.length();
    while (pos < buffer.length() && (buffer[pos] == ' ' || buffer[pos] == '\t' ||
           buffer[pos] == '\n' || buffer[pos] == '\r')) {
        pos++;
    }
    if (pos >= buffer.length() || buffer[pos] != ':') {
        return std::string::npos;
    }
    pos++;
    while (pos < buffer.length() && (buffer[pos] == ' ' || buffer[pos] == '\t' ||
           buffer[pos] == '\n' || buffer[pos] == '\r')) {
        pos++;
    }

    if (pos >= buffer.length() || buffer[pos] != '"') {
        return std::string::npos;
    }

    return pos + 1; // Return position after the opening "
}

// MARK: - Incremental delivery helpers

std::string MarkdownStreamPlugin::extractRawStringValue(const std::string& buffer, const std::string& key) const {
    size_t valueStart = findStringValueStart(buffer, key);
    if (valueStart == std::string::npos) {
        return "";
    }

    size_t closePos = 0;
    if (!isStringValueClosed(buffer, valueStart, closePos)) {
        return "";
    }

    return buffer.substr(valueStart, closePos - valueStart);
}

std::string MarkdownStreamPlugin::extractDelta(const std::string& buffer, size_t fromPos, size_t toPos) const {
    if (fromPos >= buffer.length()) {
        return "";
    }

    std::string delta;
    if (toPos == std::string::npos || toPos > buffer.length()) {
        // Open-ended: read to end of buffer, handle trailing odd backslash
        delta = buffer.substr(fromPos);
        size_t trailingBackslashes = 0;
        for (auto it = delta.rbegin(); it != delta.rend() && *it == '\\'; ++it) {
            trailingBackslashes++;
        }
        if (trailingBackslashes % 2 != 0) {
            delta.pop_back();
        }
    } else {
        // Closed range: exact bounds, no backslash handling needed
        if (toPos <= fromPos) {
            return "";
        }
        delta = buffer.substr(fromPos, toPos - fromPos);
    }

    return delta;
}

std::string MarkdownStreamPlugin::buildAppendContentJson(const std::string& delta) const {
    std::string json = "{\"id\":\"";
    json += _cachedComponentId;
    json += "\",\"component\":\"Markdown\",\"appendContent\":\"";
    json += delta;
    json += "\"}";
    return json;
}

// MARK: - DataModel nested path helpers

std::string MarkdownStreamPlugin::normalizePath(const std::string& path) {
    if (path.empty()) {
        return "/";
    }
    if (path[0] != '/') {
        return "/" + path;
    }
    return path;
}

bool MarkdownStreamPlugin::isPathPrefix(const std::string& eventPath, const std::string& bindingPath) {
    if (eventPath == "/") {
        // Root path is a prefix of every path
        return true;
    }
    if (eventPath == bindingPath) {
        return true;
    }
    // eventPath must be a strict prefix of bindingPath, with '/' at the boundary
    if (bindingPath.length() > eventPath.length() &&
        bindingPath.compare(0, eventPath.length(), eventPath) == 0 &&
        bindingPath[eventPath.length()] == '/') {
        return true;
    }
    return false;
}

std::vector<std::string> MarkdownStreamPlugin::computeRelativeSegments(
    const std::string& eventPath, const std::string& bindingPath) {

    std::vector<std::string> segments;

    std::string suffix;
    if (eventPath == "/") {
        suffix = bindingPath.substr(1);
    } else if (eventPath == bindingPath) {
        // Exact match; no further navigation needed
        return segments;
    } else {
        // eventPath is a prefix; extract the remaining portion (strip the separator /)
        suffix = bindingPath.substr(eventPath.length() + 1);
    }

    std::istringstream stream(suffix);
    std::string segment;
    while (std::getline(stream, segment, '/')) {
        if (!segment.empty()) {
            segments.push_back(segment);
        }
    }

    return segments;
}

size_t MarkdownStreamPlugin::locateNestedStringValue(
    const std::string& buffer, const std::vector<std::string>& segments) const {

    size_t pos = buffer.find("\"value\"");
    if (pos == std::string::npos) {
        return std::string::npos;
    }

    pos += 7; // strlen("\"value\"")
    while (pos < buffer.length() && (buffer[pos] == ' ' || buffer[pos] == '\t' ||
           buffer[pos] == '\n' || buffer[pos] == '\r')) {
        pos++;
    }
    if (pos >= buffer.length() || buffer[pos] != ':') {
        return std::string::npos;
    }
    pos++;
    while (pos < buffer.length() && (buffer[pos] == ' ' || buffer[pos] == '\t' ||
           buffer[pos] == '\n' || buffer[pos] == '\r')) {
        pos++;
    }

    if (segments.empty()) {
        // No nesting; value should be a string
        if (pos < buffer.length() && buffer[pos] == '"') {
            return pos + 1;
        }
        return std::string::npos;
    }

    // value must be an object
    if (pos >= buffer.length() || buffer[pos] != '{') {
        return std::string::npos;
    }

    // Navigate level by level
    for (size_t si = 0; si < segments.size(); si++) {
        const std::string& seg = segments[si];
        std::string key = "\"" + seg + "\"";

        size_t keyPos = buffer.find(key, pos);
        if (keyPos == std::string::npos) {
            return std::string::npos;
        }

        pos = keyPos + key.length();
        while (pos < buffer.length() && (buffer[pos] == ' ' || buffer[pos] == '\t' ||
               buffer[pos] == '\n' || buffer[pos] == '\r')) {
            pos++;
        }
        if (pos >= buffer.length() || buffer[pos] != ':') {
            return std::string::npos;
        }
        pos++;
        while (pos < buffer.length() && (buffer[pos] == ' ' || buffer[pos] == '\t' ||
               buffer[pos] == '\n' || buffer[pos] == '\r')) {
            pos++;
        }

        if (si < segments.size() - 1) {
            // Intermediate level must be an object
            if (pos >= buffer.length() || buffer[pos] != '{') {
                return std::string::npos;
            }
        } else {
            // Last level must be a string
            if (pos < buffer.length() && buffer[pos] == '"') {
                return pos + 1;
            }
            return std::string::npos;
        }
    }

    return std::string::npos;
}

std::string MarkdownStreamPlugin::buildAppendDataModelJson(
    const DataModelStreamingEntry& entry, const std::string& delta) const {
    return buildDataModelEventJson(entry, delta, "appendDataModel");
}

std::string MarkdownStreamPlugin::buildDataModelEventJson(
    const DataModelStreamingEntry& entry, const std::string& delta, const std::string& eventKey) const {

    // Dispatch at binding-path level: path points exactly to the leaf binding path, value is the direct value.
    // This ensures notifyAffectedObservers only notifies observers of this binding path.
    nlohmann::json eventObj;
    eventObj["surfaceId"] = entry.surfaceId;
    eventObj["path"] = entry.bindingPath;
    eventObj["value"] = delta;

    nlohmann::json resultObj;
    resultObj[eventKey] = eventObj;

    return resultObj.dump();
}

void MarkdownStreamPlugin::dispatchLeafFieldEvents(
    const nlohmann::json& value,
    const std::string& surfaceId,
    const std::string& basePath,
    const std::set<std::string>& activeStreamingPaths,
    std::vector<ProtocolStreamExtractor::ParseResult>& outResults) const {

    if (value.is_object()) {
        for (auto it = value.begin(); it != value.end(); ++it) {
            std::string childPath;
            if (basePath.empty() || basePath == "/") {
                childPath = "/" + it.key();
            } else {
                childPath = basePath + "/" + it.key();
            }

            // Skip Markdown binding paths that are already being streamed (handled by streaming append)
            if (activeStreamingPaths.count(childPath) > 0) {
                continue;
            }

            // Recurse into object children; dispatch all other types as leaves
            dispatchLeafFieldEvents(it.value(), surfaceId, childPath,
                                    activeStreamingPaths, outResults);
        }
    } else {
        // Leaf value: string, number, boolean, null, or array; build an individual updateDataModel event
        nlohmann::json eventObj;
        eventObj["surfaceId"] = surfaceId;
        eventObj["path"] = basePath.empty() ? "/" : basePath;
        eventObj["value"] = value;

        nlohmann::json resultObj;
        resultObj["updateDataModel"] = eventObj;

        ProtocolStreamExtractor::ParseResult result;
        result.type = ProtocolStreamExtractor::ParseResult::Type::NormalEvent;
        result.eventType = ProtocolStreamExtractor::EventType::UpdateDataModel;
        result.eventJson = resultObj.dump();
        outResults.emplace_back(std::move(result));
    }
}

} // namespace agenui
