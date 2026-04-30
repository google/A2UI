#pragma once

#include <string>
#include <set>
#include <vector>
#include "nlohmann/json.hpp"
#include "agenui_stream_plugin_interface.h"

namespace agenui {

/**
 * @brief DataModel streaming entry
 *
 * Tracks the streaming state of a single Markdown data-binding path.
 * One updateDataModel event's path may cover multiple binding paths (prefix match);
 * each matched binding path corresponds to one DataModelStreamingEntry.
 */
struct DataModelStreamingEntry {
    std::string bindingPath;      // Full binding path of the Markdown component, e.g. "/route/info"
    std::string eventPath;        // Path from the current updateDataModel event, e.g. "/" or "/route"
    std::string surfaceId;        // Associated surfaceId
    size_t leafValueStart = 0;    // Start position of the leaf string value in the buffer (after the opening ")
    size_t lastSentEnd = 0;       // Buffer end position of the last sent content
    bool firstEventSent = false;  // Whether the first updateDataModel event has been sent
};

/**
 * @brief Markdown component streaming parse plugin
 *
 * Implements IStreamPlugin to provide incremental streaming for Markdown components:
 * 1. Inline content: starts delivering partial content in updateComponents before the content field is fully closed.
 * 2. Data-bound content: in updateDataModel, identifies the Markdown-bound path and streams the value incrementally.
 *
 * Usage:
 *   auto plugin = std::unique_ptr<MarkdownStreamPlugin>(new MarkdownStreamPlugin());
 *   extractor.setPlugin(plugin.get());
 *   // Disable: extractor.setPlugin(nullptr);
 */
class MarkdownStreamPlugin : public IStreamPlugin {
public:
    MarkdownStreamPlugin() = default;

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

    /// Checks whether "component":"Markdown" has appeared in buffer[startPos..].
    bool isPartialMarkdownComponent(const std::string& buffer, size_t startPos) const;

    /// Finds the start position of the "content" value (after the opening ").
    /// Returns npos if "content" is followed by { (data binding).
    size_t findInlineContentValueStart(const std::string& buffer, size_t startPos) const;

    /// Checks whether the string value starting at valueStart is closed (unescaped ").
    bool isStringValueClosed(const std::string& buffer, size_t valueStart, size_t& closePos) const;

    /// Builds a partial JSON from startPos to end of buffer, handling trailing escapes, then appends suffix.
    std::string constructPartialJson(const std::string& data, size_t startPos, const std::string& suffix) const;

    /// Parses a complete component JSON and records the binding path if it is a Markdown data binding.
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

    /// Builds an incremental component JSON (appendContent field) using the cached _cachedComponentId.
    std::string buildAppendContentJson(const std::string& delta) const;

    // ---- DataModel nested path helpers ----

    /// Normalizes a path: converts empty string to "/", ensures leading "/".
    static std::string normalizePath(const std::string& path);

    /// Returns true if eventPath is a prefix of (or equal to) bindingPath.
    static bool isPathPrefix(const std::string& eventPath, const std::string& bindingPath);

    /// Computes the path segments of bindingPath relative to eventPath.
    /// e.g. eventPath="/", bindingPath="/route/info" => {"route","info"}
    static std::vector<std::string> computeRelativeSegments(const std::string& eventPath, const std::string& bindingPath);

    /// Starting from the "value" field in buffer, navigates down along segments to the leaf string.
    /// Returns the start position of the leaf string value (after the opening "), or npos on failure.
    size_t locateNestedStringValue(const std::string& buffer, const std::vector<std::string>& segments) const;

    /// Builds an appendDataModel incremental JSON.
    std::string buildAppendDataModelJson(const DataModelStreamingEntry& entry, const std::string& delta) const;

    /// Generic DataModel event JSON builder; eventKey selects updateDataModel or appendDataModel.
    std::string buildDataModelEventJson(
        const DataModelStreamingEntry& entry, const std::string& delta, const std::string& eventKey) const;

    /// Recursively traverses the value tree and dispatches individual updateDataModel events for each non-streaming leaf field.
    /// Skips Markdown binding paths already handled by streaming (in activeStreamingPaths).
    void dispatchLeafFieldEvents(
        const nlohmann::json& value,
        const std::string& surfaceId,
        const std::string& basePath,
        const std::set<std::string>& activeStreamingPaths,
        std::vector<ProtocolStreamExtractor::ParseResult>& outResults) const;

    // ---- Component streaming state ----
    bool _isComponentStreaming = false;
    size_t _componentStart = 0;           // Position of the Markdown component '{' in the buffer
    size_t _contentValueStart = 0;        // Start position of the content value
    size_t _lastSentContentEnd = 0;       // Buffer end position of the last sent content
    std::string _cachedComponentId;       // Cached component id during streaming (raw JSON-encoded)

    // ---- DataModel streaming state ----
    bool _isDataModelStreaming = false;
    std::vector<DataModelStreamingEntry> _streamingEntries;  // Currently active streaming binding entries

    // ---- Markdown binding path set ----
    std::set<std::string> _markdownBindingPaths;
};

} // namespace agenui
