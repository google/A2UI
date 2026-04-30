#pragma once

#include <string>
#include <cstdint>
#include <vector>
#include "agenui_protocol_stream_extractor.h"
#include "agenui_markdown_stream_plugin.h"
#include "agenui_text_stream_plugin.h"
#include "agenui_composite_stream_plugin.h"
#include <memory>

namespace agenui {

class SurfaceCoordinator;

/**
 * @brief Streaming content parser (formerly SessionManager)
 *
 * Handles streaming data reception, parsing, and forwarding.
 *
 * Supported operations:
 * 1. createSurface
 * 2. updateComponents (with streaming support for chunked reception)
 * 3. updateDataModel
 * 4. deleteSurface
 */
class StreamingContentParser {
public:
    /**
     * @brief Constructor.
     * @param coordinator SurfaceCoordinator pointer (not owned)
     */
    explicit StreamingContentParser(SurfaceCoordinator* coordinator);
    ~StreamingContentParser();

    bool start();
    void stop();
    bool isRunning() const { return _isRunning.load(); }

    void setQueryContent(const std::string &content);

    void processDataBeginning();
    void processDataAssembling(const std::string& data);
    void processDataEnding();

private:
    void processNormalEvent(const ProtocolStreamExtractor::ParseResult& result);
    void sendSingleComponentUpdate(const std::string& componentJson, const std::string& surfaceId, const std::string& version);
    void dispatchParseResults(const std::vector<ProtocolStreamExtractor::ParseResult>& results);
    void resetState();

    SurfaceCoordinator* _coordinator = nullptr;

    ProtocolStreamExtractor _extractor;
    std::unique_ptr<MarkdownStreamPlugin> _markdownPlugin;
    std::unique_ptr<TextStreamPlugin> _textPlugin;
    std::unique_ptr<CompositeStreamPlugin> _compositePlugin;
    std::recursive_mutex _mutex;

    std::string _queryContent;
    std::string _mockServer = "C4";
    std::atomic_bool _isRunning;
};

} // namespace agenui
