#pragma once

#include <string>
#include <vector>
#include "agenui_stream_plugin_interface.h"

namespace agenui {

/**
 * @brief Composite stream parsing plugin
 *
 * Manages multiple sub-plugins (e.g., MarkdownStreamPlugin, TextStreamPlugin)
 * and exposes them as a single IStreamPlugin.
 *
 * Delegation strategy:
 * - onComponentExtracted: notifies all sub-plugins (each collects its own binding paths)
 * - handleIncompleteComponent: tries sub-plugins in order; the first to succeed takes over
 * - continueComponentStreaming: delegates to the currently streaming sub-plugin
 * - handleIncompleteDataModel: tries sub-plugins in order; the first to succeed takes over
 * - continueDataModelStreaming: delegates to the currently streaming sub-plugin
 * - shouldStreamField: returns true if any sub-plugin returns true (OR logic)
 * - isComponentStreaming/isDataModelStreaming: true if any sub-plugin is streaming
 * - reset: resets all sub-plugins
 */
class CompositeStreamPlugin : public IStreamPlugin {
public:
    CompositeStreamPlugin() = default;

    /**
     * @brief Adds a sub-plugin.
     * @param plugin Sub-plugin pointer (lifecycle managed by the caller)
     */
    void addPlugin(IStreamPlugin* plugin);

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

    bool isComponentStreaming() const override;
    bool isDataModelStreaming() const override;

    void reset() override;

    bool shouldStreamField(const std::string& fieldPath) const override;

private:
    std::vector<IStreamPlugin*> _plugins;  // Non-owning pointers; lifecycle managed externally
};

} // namespace agenui
