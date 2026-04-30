#include "agenui_composite_stream_plugin.h"
#include "agenui_log.h"

namespace agenui {

void CompositeStreamPlugin::addPlugin(IStreamPlugin* plugin) {
    if (plugin) {
        _plugins.push_back(plugin);
    }
}

// MARK: - IStreamPlugin interface

void CompositeStreamPlugin::onComponentExtracted(const std::string& componentJson) {
    // Notify all sub-plugins to collect their respective component binding paths
    for (auto* plugin : _plugins) {
        plugin->onComponentExtracted(componentJson);
    }
}

bool CompositeStreamPlugin::handleIncompleteComponent(
    const std::string& buffer, size_t componentStartPos,
    const std::string& surfaceId, const std::string& version,
    std::vector<ProtocolStreamExtractor::ParseResult>& outResults) {

    // Try sub-plugins in order; return as soon as one takes over.
    // Since isPartialMarkdownComponent and isPartialTextComponent detect different component types,
    // each component will be matched by at most one plugin.
    for (auto* plugin : _plugins) {
        if (plugin->handleIncompleteComponent(buffer, componentStartPos,
                                               surfaceId, version, outResults)) {
            return true;
        }
    }
    return false;
}

bool CompositeStreamPlugin::continueComponentStreaming(
    const std::string& buffer,
    const std::string& surfaceId, const std::string& version,
    std::vector<ProtocolStreamExtractor::ParseResult>& outResults,
    size_t& outParsePosition) {

    // Delegate to the sub-plugin currently streaming
    for (auto* plugin : _plugins) {
        if (plugin->isComponentStreaming()) {
            return plugin->continueComponentStreaming(
                buffer, surfaceId, version, outResults, outParsePosition);
        }
    }
    // No sub-plugin is streaming (should not happen, defensive)
    return false;
}

bool CompositeStreamPlugin::handleIncompleteDataModel(
    const std::string& buffer,
    std::vector<ProtocolStreamExtractor::ParseResult>& outResults) {

    // Try sub-plugins in order; each plugin checks its own binding path set
    for (auto* plugin : _plugins) {
        if (plugin->handleIncompleteDataModel(buffer, outResults)) {
            return true;
        }
    }
    return false;
}

bool CompositeStreamPlugin::continueDataModelStreaming(
    const std::string& buffer,
    std::vector<ProtocolStreamExtractor::ParseResult>& outResults,
    size_t& outEndPosition) {

    // Delegate to the sub-plugin currently streaming
    for (auto* plugin : _plugins) {
        if (plugin->isDataModelStreaming()) {
            return plugin->continueDataModelStreaming(
                buffer, outResults, outEndPosition);
        }
    }
    // No sub-plugin is streaming
    return false;
}

bool CompositeStreamPlugin::isComponentStreaming() const {
    for (const auto* plugin : _plugins) {
        if (plugin->isComponentStreaming()) {
            return true;
        }
    }
    return false;
}

bool CompositeStreamPlugin::isDataModelStreaming() const {
    for (const auto* plugin : _plugins) {
        if (plugin->isDataModelStreaming()) {
            return true;
        }
    }
    return false;
}

void CompositeStreamPlugin::reset() {
    for (auto* plugin : _plugins) {
        plugin->reset();
    }
}

bool CompositeStreamPlugin::shouldStreamField(const std::string& fieldPath) const {
    // OR logic: return true if any sub-plugin needs streaming.
    // Markdown uses exact matching; Text uses suffix matching — they are mutually exclusive.
    for (const auto* plugin : _plugins) {
        if (plugin->shouldStreamField(fieldPath)) {
            return true;
        }
    }
    return false;
}

} // namespace agenui
