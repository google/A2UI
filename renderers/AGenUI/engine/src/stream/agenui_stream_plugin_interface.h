#pragma once

#include <string>
#include <vector>
#include "agenui_protocol_stream_extractor.h"

namespace agenui {

/**
 * @brief Stream parsing plugin interface
 *
 * Provides pluggable streaming extension capability for ProtocolStreamExtractor.
 * Plugins intercept the parsing pipeline via hook points without altering the state machine.
 * Call setPlugin(nullptr) to disable the plugin and restore the default behavior.
 */
class IStreamPlugin {
public:
    virtual ~IStreamPlugin() = default;

    /**
     * @brief Hook 1: called after a complete component is extracted.
     * Used to collect component info (e.g., Markdown binding paths).
     * @param componentJson Complete component JSON string
     */
    virtual void onComponentExtracted(const std::string& componentJson) = 0;

    /**
     * @brief Hook 2: called when component JSON is incomplete.
     * Checks whether this is a component type requiring streaming; if so, enters plugin streaming mode.
     * @param buffer Current data buffer
     * @param componentStartPos Position of the component '{' in buffer
     * @param surfaceId Current surfaceId
     * @param version Protocol version
     * @param outResults Output result list
     * @return true if the plugin takes over (caller should return); false to use normal logic
     */
    virtual bool handleIncompleteComponent(
        const std::string& buffer, size_t componentStartPos,
        const std::string& surfaceId, const std::string& version,
        std::vector<ProtocolStreamExtractor::ParseResult>& outResults) = 0;

    /**
     * @brief Hook 3: continuation of plugin component streaming mode.
     * Called on each driveParser invocation while the plugin is in component streaming mode.
     * @param buffer Current data buffer
     * @param surfaceId Current surfaceId
     * @param version Protocol version
     * @param outResults Output result list
     * @param outParsePosition New parse position when streaming ends
     * @return true = still streaming; false = streaming ended
     */
    virtual bool continueComponentStreaming(
        const std::string& buffer,
        const std::string& surfaceId, const std::string& version,
        std::vector<ProtocolStreamExtractor::ParseResult>& outResults,
        size_t& outParsePosition) = 0;

    /**
     * @brief Hook 4: incomplete updateDataModel detection.
     * Checks whether this is a data model event requiring streaming.
     * @param buffer Current data buffer
     * @param outResults Output result list
     * @return true if the plugin takes over; false to use normal logic
     */
    virtual bool handleIncompleteDataModel(
        const std::string& buffer,
        std::vector<ProtocolStreamExtractor::ParseResult>& outResults) = 0;

    /**
     * @brief Hook 5: continuation of plugin DataModel streaming mode.
     * @param buffer Current data buffer
     * @param outResults Output result list
     * @param outEndPosition Position after JSON end (valid only when returning false)
     * @return true = still streaming; false = done
     */
    virtual bool continueDataModelStreaming(
        const std::string& buffer,
        std::vector<ProtocolStreamExtractor::ParseResult>& outResults,
        size_t& outEndPosition) = 0;

    /** @brief Returns whether the plugin is in component streaming mode. */
    virtual bool isComponentStreaming() const = 0;

    /** @brief Returns whether the plugin is in DataModel streaming mode. */
    virtual bool isDataModelStreaming() const = 0;

    /** @brief Resets plugin state. */
    virtual void reset() = 0;

    /**
     * @brief Queries whether a given field path should be streamed incrementally.
     * Called by DM streaming when a string value is encountered, to decide whether
     * incremental delivery is needed (e.g., Markdown binding paths).
     * @param fieldPath Full field path, e.g. "/route/info"
     * @return true if incremental streaming is needed; false to wait for the complete value
     */
    virtual bool shouldStreamField(const std::string& fieldPath) const = 0;
};

} // namespace agenui
