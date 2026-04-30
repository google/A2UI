#pragma once

#include "../hybrid/a2ui_hybrid_view.h"

namespace a2ui {

/**
 * Hybrid Web component driven by ArkTS HybridWebView.
 *
 * Architecture:
 *   - Inherits from A2UIHybridView
 *   - C++ parses source and styles, then forwards updates to ArkTS
 *   - ArkTS renders Web(), measures scrollHeight, and reports height back
 *
 * Supported properties:
 *   - source: URL (http/https) or inline HTML
 *   - height: fixed height in vp
 *   - min-height: minimum height in vp
 *   - max-height: maximum height in vp
 */
class WebComponent : public A2UIHybridView {
public:
    WebComponent(ComponentState* state, ArkUI_NodeHandle arkuiHandle, const ArkTSObject& componentContent);
    ~WebComponent() override;

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    /**
     * Parse source and return whether it changed.
     */
    bool applySource(const nlohmann::json& properties);

    /**
     * Parse and apply height-related styles, and return whether they changed.
     */
    bool applyStyles(const nlohmann::json& properties);

    /**
     * Notify the ArkTS side to update a specific property
     */
    void notifyHybridViewUpdate(const std::vector<std::string>& changedKeys);

private:
    std::string m_source;
};

} // namespace a2ui
