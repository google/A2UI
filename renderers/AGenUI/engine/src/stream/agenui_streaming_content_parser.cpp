#include "agenui_streaming_content_parser.h"
#include "agenui_log.h"
#include <cstring>
#include "nlohmann/json.hpp"
#include "module/agenui_thread_manager.h"
#include "surface/agenui_surface_coordinator.h"

namespace agenui {

    StreamingContentParser::StreamingContentParser(SurfaceCoordinator* coordinator)
        : _coordinator(coordinator) {
        _markdownPlugin = std::unique_ptr<MarkdownStreamPlugin>(new MarkdownStreamPlugin());
        _textPlugin = std::unique_ptr<TextStreamPlugin>(new TextStreamPlugin());
        _compositePlugin = std::unique_ptr<CompositeStreamPlugin>(new CompositeStreamPlugin());
        _compositePlugin->addPlugin(_markdownPlugin.get());
        _compositePlugin->addPlugin(_textPlugin.get());
        _extractor.setPlugin(_compositePlugin.get());
    }

    StreamingContentParser::~StreamingContentParser() {
        stop();
    }

    bool StreamingContentParser::start() {
        return true;
    }

    void StreamingContentParser::stop() {
    }

    void StreamingContentParser::setQueryContent(const std::string &content) {
        _queryContent = content;
    }

    void StreamingContentParser::processDataBeginning() {
        resetState();
    }

    void StreamingContentParser::processDataAssembling(const std::string& data) {
        _extractor.appendData(data);
        auto results = _extractor.driveParser();
        dispatchParseResults(results);
    }

    void StreamingContentParser::processDataEnding() {
        resetState();
    }

    void StreamingContentParser::dispatchParseResults(const std::vector<ProtocolStreamExtractor::ParseResult>& results) {
        for (const auto& result : results) {
            if (result.type == ProtocolStreamExtractor::ParseResult::Type::NormalEvent) {
                processNormalEvent(result);
            } else {
                sendSingleComponentUpdate(result.componentJson, result.surfaceId, result.version);
            }
        }
    }

    void StreamingContentParser::processNormalEvent(const ProtocolStreamExtractor::ParseResult& result) {
        if (!_coordinator) {
            return;
        }

        const std::string& data = result.eventJson;
        if (result.eventType == ProtocolStreamExtractor::EventType::CreateSurface) {
            _coordinator->createSurface(data);
        } else if (result.eventType == ProtocolStreamExtractor::EventType::UpdateDataModel) {
            _coordinator->updateDataModel(data);
        } else if (result.eventType == ProtocolStreamExtractor::EventType::AppendDataModel) {
            _coordinator->appendDataModel(data);
        } else if (result.eventType == ProtocolStreamExtractor::EventType::DeleteSurface) {
            _coordinator->deleteSurface(data);
        }
    }

    void StreamingContentParser::sendSingleComponentUpdate(const std::string& componentJson, const std::string& surfaceId, const std::string& version) {
        if (!_coordinator) {
            return;
        }

        std::string updateJson = "{";
        if (!version.empty()) {
            updateJson += "\"version\":\"" + version + "\",";
        }
        updateJson += "\"updateComponents\":{";
        updateJson += "\"surfaceId\":\"" + surfaceId + "\",";
        updateJson += "\"components\":[" + componentJson + "]";
        updateJson += "}}";
        _coordinator->updateComponents(updateJson);
    }

    void StreamingContentParser::resetState() {
        _extractor.reset();
    }

} // namespace agenui
