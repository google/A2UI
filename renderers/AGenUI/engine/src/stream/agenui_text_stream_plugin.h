#pragma once

#include <string>
#include <set>
#include <vector>
#include "nlohmann/json.hpp"
#include "agenui_stream_plugin_interface.h"

namespace agenui {

/**
 * @brief DataModel streaming entry (Text version)
 *
 * Tracks the streaming state of a single Text data-binding path.
 * One updateDataModel event's path may cover multiple binding paths (prefix or suffix match);
 * each matched binding path corresponds to one TextDataModelStreamingEntry.
 */
struct TextDataModelStreamingEntry {
    std::string bindingPath;      // Full binding path of the Text component, e.g. "/flight/text" or "/text"
    std::string eventPath;        // Path from the current updateDataModel event
    std::string surfaceId;        // Associated surfaceId
    size_t leafValueStart = 0;    // Start position of the leaf string value in the buffer (after the opening ")
    size_t lastSentEnd = 0;       // Buffer end position of the last sent content
    bool firstEventSent = false;  // Whether the first updateDataModel event has been sent
};

/**
 * @brief Text component streaming parse plugin
 *
 * Implements IStreamPlugin to provide incremental streaming for Text components:
 * 1. Inline text: starts delivering partial content in updateComponents before the text field is fully closed.
 * 2. Data-bound text: in updateDataModel, identifies the Text-bound path and streams the value incrementally.
 *
 * Key differences from MarkdownStreamPlugin:
 * - Component type: "Text" instead of "Markdown"
 * - Content field: "text" instead of "content"
 * - Delta field: "textChunk" instead of "appendContent"
 * - Path matching: also supports suffix matching (for List scenarios)
 */
class TextStreamPlugin : public IStreamPlugin {
public:
    TextStreamPlugin() = default;

    // ---- IStreamPlugin interface ----
    void onComponentExtracted(const std::string& componentJson) override;

    bool handleIncompleteComponent(
        const std::string& buffer, size_t componentStartPos,
        const std::string& surfaceId, const std::string& version,
        std::vector<ProtocolStreamExtractor::ParseResult>& outResults) override;

    bool continueComponentStreaming(
        const std::string& buffer,
        const std::string& surfaceId, const std::string& version,
        std::vector<ProtocolStreamExtractor::ParseResult>& outResults,
        size_t& outParsePosition) override;

    bool handleIncompleteDataModel(
        const std::string& buffer,
        std::vector<ProtocolStreamExtractor::ParseResult>& outResults) override;

    bool continueDataModelStreaming(
        const std::string& buffer,
        std::vector<ProtocolStreamExtractor::ParseResult>& outResults,
        size_t& outEndPosition) override;

    bool isComponentStreaming() const override { return _isComponentStreaming; }
    bool isDataModelStreaming() const override { return _isDataModelStreaming; }

    void reset() override;

    bool shouldStreamField(const std::string& fieldPath) const override;

private:
    // ---- JSON parsing utilities ----

    /// Checks whether "component":"Text" has appeared in buffer[startPos..].
    bool isPartialTextComponent(const std::string& buffer, size_t startPos) const;

    /// Finds the start position of the "text" value (after the opening ").
    /// Returns npos if "text" is followed by { (data binding).
    size_t findInlineTextValueStart(const std::string& buffer, size_t startPos) const;

    /// Checks whether the string value starting at valueStart is closed (unescaped ").
    bool isStringValueClosed(const std::string& buffer, size_t valueStart, size_t& closePos) const;

    /// Builds a partial JSON from startPos to end of buffer, handling trailing escapes, then appends suffix.
    std::string constructPartialJson(const std::string& data, size_t startPos, const std::string& suffix) const;

    /// Parses a complete component JSON and records the binding path if it is a Text data binding.
    void collectBindingPath(const std::string& componentJson);

    /// Extracts the string value for the given key from buffer (simple string search).
    std::string extractStringValue(const std::string& buffer, const std::string& key) const;

    /// Finds the start position of the string value for the given key (after "key":").
    size_t findStringValueStart(const std::string& buffer, const std::string& key) const;

    // ---- Incremental delivery helpers ----

    /// Extracts the raw JSON-encoded content of the string value for key (without unescaping), safe to embed in new JSON.
    std::string extractRawStringValue(const std::string& buffer, const std::string& key) const;

    /// Extracts the incremental content from buffer[fromPos, toPos); when toPos==npos reads to end and handles trailing odd backslash.
    std::string extractDelta(const std::string& buffer, size_t fromPos, size_t toPos) const;

    /// Builds a textChunk component JSON using the cached _cachedComponentId and the delta text.
    std::string buildAppendTextChunkJson(const std::string& delta) const;

    // ---- DataModel nested path helpers ----

    /// Normalizes a path: converts empty string to "/", ensures leading "/".
    static std::string normalizePath(const std::string& path);

    /// Returns true if eventPath is a prefix of (or equal to) bindingPath.
    static bool isPathPrefix(const std::string& eventPath, const std::string& bindingPath);

    /// Returns true if fieldPath ends with bindingPath (suffix match for List scenarios).
    static bool isSuffixMatch(const std::string& fieldPath, const std::string& bindingPath);

    /// Computes the path segments of bindingPath relative to eventPath.
    static std::vector<std::string> computeRelativeSegments(const std::string& eventPath, const std::string& bindingPath);

    /// Starting from the "value" field in buffer, navigates down along segments to the leaf string.
    size_t locateNestedStringValue(const std::string& buffer, const std::vector<std::string>& segments) const;

    /// Builds an appendDataModel incremental JSON.
    std::string buildAppendDataModelJson(const TextDataModelStreamingEntry& entry, const std::string& delta) const;

    /// Generic DataModel event JSON builder; eventKey selects updateDataModel or appendDataModel.
    std::string buildDataModelEventJson(
        const TextDataModelStreamingEntry& entry, const std::string& delta, const std::string& eventKey) const;

    /// Recursively traverses the value tree and dispatches individual updateDataModel events for each non-streaming leaf field.
    void dispatchLeafFieldEvents(
        const nlohmann::json& value,
        const std::string& surfaceId,
        const std::string& basePath,
        const std::set<std::string>& activeStreamingPaths,
        std::vector<ProtocolStreamExtractor::ParseResult>& outResults) const;

    // ---- Component streaming state ----
    bool _isComponentStreaming = false;
    size_t _componentStart = 0;           // Position of the Text component '{' in the buffer
    size_t _textValueStart = 0;           // Start position of the text value
    size_t _lastSentContentEnd = 0;       // Buffer end position of the last sent content
    std::string _cachedComponentId;       // Cached component id during streaming (raw JSON-encoded)

    // ---- DataModel streaming state ----
    bool _isDataModelStreaming = false;
    std::vector<TextDataModelStreamingEntry> _streamingEntries;

    // ---- Text binding path set ----
    std::set<std::string> _textBindingPaths;
};

} // namespace agenui
