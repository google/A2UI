#pragma once

#include <string>
#include <vector>

namespace agenui {

class IStreamPlugin;

/**
 * @brief Protocol streaming data parser
 *
 * Implements the full state machine for parsing streaming protocol data:
 * - Manages the data buffer, supporting accumulation of fragmented chunks
 * - Drives event detection, JSON completeness checking, and streaming component extraction for updateComponents
 * - Exposes a parse-result list to callers without exposing internal state-machine details
 *
 * Supported event types: createSurface, updateComponents (streaming), updateDataModel, deleteSurface
 */
class ProtocolStreamExtractor {
public:
    enum class EventType {
        Unknown,
        CreateSurface,
        UpdateComponents,
        UpdateDataModel,
        AppendDataModel,
        DeleteSurface
    };

    /**
     * @brief Single parse result
     *
     * NormalEvent: a complete non-streaming event (createSurface / updateDataModel / deleteSurface)
     * ComponentUpdate: a single component object from updateComponents
     */
    struct ParseResult {
        enum class Type { NormalEvent, ComponentUpdate };
        Type type = Type::NormalEvent;
        EventType eventType = EventType::Unknown;
        std::string eventJson;      // Valid for NormalEvent: complete event JSON
        std::string componentJson;  // Valid for ComponentUpdate: single component JSON
        std::string surfaceId;      // Valid for ComponentUpdate
        std::string version;        // Valid for ComponentUpdate
    };

    ProtocolStreamExtractor() = default;

    /**
     * @brief Sets the streaming parse plugin (optional).
     * Pass nullptr to disable the plugin and restore default behavior.
     * @param plugin Plugin pointer; lifetime managed by the caller.
     */
    void setPlugin(IStreamPlugin* plugin);

    /**
     * @brief Appends newly arrived streaming data to the internal buffer.
     * @param data New data chunk.
     */
    void appendData(const std::string& data);
    std::vector<ParseResult> driveParser();
    bool hasUnprocessedData() const;
    void reset();

    /**
     * @brief Extracts the first complete JSON object from the given buffer (static).
     * @param buffer Input buffer.
     * @param outJson Output: the extracted complete JSON string.
     * @param outEndPos Output: position immediately after the JSON end.
     * @return Whether a complete JSON was successfully extracted.
     */
    static bool extractFirstCompleteJson(const std::string& buffer, std::string& outJson, size_t& outEndPos);

    /**
     * @brief Checks whether a JSON object is fully closed (static).
     * @param json JSON string.
     * @param startPos Start position.
     * @param endPos Output: end position.
     * @return Whether the object is fully closed.
     */
    static bool isJsonObjectComplete(const std::string& json, size_t startPos, size_t& endPos);

    /**
     * @brief Detects the event type in JSON data.
     * @param data JSON data.
     * @return Event type.
     */
    EventType detectEventType(const std::string& data) const;

private:
    enum class StreamState {
        Idle,
        StreamingComponents,
        StreamingDataModel
    };

    /**
     * @brief DataModel streaming parse stack frame.
     * Tracks nesting depth during recursive parsing of a value object.
     */
    struct DmStackEntry {
        enum class Type { Object, Array };
        Type type;
        std::string pathPrefix;   // Accumulated path to reach this level
        int arrayIndex;           // Current element index in Array mode

        DmStackEntry(Type t, const std::string& path, int idx = 0)
            : type(t), pathPrefix(path), arrayIndex(idx) {}
    };

    // State-machine main loop (processes all complete events)
    void processAllCompleteEvents(std::vector<ParseResult>& outResults);
    // Streaming component extraction loop
    void processStreamingData(std::vector<ParseResult>& outResults);
    // Initializes updateComponents streaming (extracts surfaceId/version, locates components array)
    bool startStreamingComponents();

    // === DataModel streaming ===
    bool startStreamingDataModel();
    void processStreamingDataModel(std::vector<ParseResult>& outResults);
    void handleDataModelComplete(std::vector<ParseResult>& outResults);
    void emitDataModelUpdate(const std::string& surfaceId, const std::string& path,
                             const std::string& rawValue, std::vector<ParseResult>& outResults);
    void resetDataModelStreamState();

    // === Field-level incremental streaming for Markdown (sub-process embedded in DM streaming) ===
    void startMarkdownFieldStreaming(const std::string& fieldPath, size_t valueQuotePos,
                                      std::vector<ParseResult>& outResults);
    bool continueMarkdownFieldStreaming(std::vector<ParseResult>& outResults);
    void emitAppendDataModel(const std::string& surfaceId, const std::string& path,
                              const std::string& delta, std::vector<ParseResult>& outResults);
    size_t computeSafeEnd(size_t fromPos) const;

    // JSON parsing low-level methods
    bool extractNextComponent(std::string& outComponent);
    bool isUpdateComponentsComplete();
    bool isJsonArrayComplete(const std::string& json, size_t startPos, size_t& endPos) const;
    bool isCompleteJson(const std::string& json) const;
    bool extractCompleteJsonValue(const std::string& buffer, size_t startPos, size_t& outEndPos) const;
    bool findClosingQuote(const std::string& buffer, size_t startPos, size_t& outEndPos) const;
    bool isValidClosingQuote(const std::string& buffer, size_t quotePos) const;
    std::string removeInnerQuotes(const std::string& str) const;
    bool extractJsonStringAt(const std::string& buffer, size_t pos, std::string& outStr, size_t& outEndPos) const;
    std::string extractSurfaceId(const std::string& data) const;
    std::string extractVersion(const std::string& data) const;
    std::string extractStringField(const std::string& data, const std::string& fieldName) const;
    size_t findComponentsArrayStart(const std::string& data) const;
    bool isDataModelEventComplete();
    const char* getEventTypeName(EventType type) const;

    std::string _dataBuffer;
    size_t _parsePosition = 0;
    std::string _surfaceId;
    std::string _version;
    StreamState _streamState = StreamState::Idle;
    IStreamPlugin* _plugin = nullptr;  // Optional streaming parse plugin

    // DataModel streaming state
    std::string _dmSurfaceId;
    std::string _dmBasePath;
    size_t _dmParsePosition = 0;
    size_t _dmValueStart = 0;
    std::vector<DmStackEntry> _dmStack;

    // Field-level incremental streaming state for Markdown (embedded in DM streaming)
    bool _dmMarkdownStreaming = false;       // Whether a Markdown field is currently being streamed
    std::string _dmMarkdownFieldPath;        // Full path of the field being streamed
    size_t _dmMarkdownValueStart = 0;        // Start position of the string value content (after opening ")
    size_t _dmMarkdownLastSentEnd = 0;       // End position of the last sent content
    bool _dmMarkdownFirstSent = false;       // Whether the first updateDataModel has been sent
};

} // namespace agenui
