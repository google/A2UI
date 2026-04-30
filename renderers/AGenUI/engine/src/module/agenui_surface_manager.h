#pragma once

#include <atomic>
#include <memory>
#include <string>
#include <vector>
#include "agenui_surface_manager_interface.h"
#include "agenui_component_render_observable.h"
#include "agenui_surface_layout_observable.h"

namespace agenui {

class StreamingContentParser;
class SurfaceCoordinator;
class EventDispatcher;
class IAGenUIMessageListener;
class IThread;

/**
 * @brief SurfaceManager implementation (formerly AGenUIRuntimeContext)
 *
 * Per-instance context manager that owns all multi-instance modules for one UI rendering context:
 * - EventDispatcher (member object)
 * - StreamingContentParser
 * - SurfaceCoordinator
 *
 * Lifecycle managed by AGenUIEngine.
 *
 * Threading model:
 * - All SurfaceManager instances share one worker thread (AGENUI_SHARED_THREAD_ID)
 * - The shared worker thread is created/destroyed by AGenUIEngine on start/stop
 * - Public APIs that receive data or change state are called on the main thread (e.g. receiveTextChunk)
 * - Internal logic is dispatched to the shared worker thread via post()
 */
class SurfaceManager : public ISurfaceManager,
                       public ComponentRenderListener,
                       public SurfaceLayoutListener,
                       public std::enable_shared_from_this<SurfaceManager> {
public:
    /**
     * @brief Constructor.
     * @param engineId Engine instance ID
     */
    explicit SurfaceManager(int engineId);
    ~SurfaceManager();

    bool enterRunning();

    bool exitRunning();

    /**
     * @brief Initializes all internal modules.
     */
    bool init();

    /**
     * @brief Stops all internal modules and releases resources.
     */
    void uninit();

    int getEngineId() const override { return _engineId; }
    void addSurfaceEventListener(IAGenUIMessageListener* listener) override;
    void removeSurfaceEventListener(IAGenUIMessageListener* listener) override;
    void submitUIAction(const ActionMessage& msg) override;
    void submitUIDataModel(const SyncUIToDataMessage& msg) override;

    /**
     * @brief Begins a streaming session for A2UI protocol data.
     *
     * Call before starting a new streaming session; the SDK clears buffers and resets parse state.
     *
     * When to call:
     * - Before a new stream begins
     * - Before the first receiveTextChunk call
     *
     * Contract:
     * - Recommended sequence: beginTextStream → receiveTextChunk × N → endTextStream
     * - If skipped, receiveTextChunk still works (compatibility mode),
     *   but leftover state from the previous session may not be cleaned up
     *
     * Thread: must be called on the same thread as receiveTextChunk
     */
    void beginTextStream() override;

    /**
     * @brief Ends a streaming session.
     *
     * Call after all stream data has been delivered; the SDK checks for leftover unprocessed data
     * and clears buffers and resets parse state.
     *
     * When to call:
     * - SSE stream closed normally (stream close / EOF)
     * - HTTP response ended
     * - User aborted the current session
     * - Cleanup after network disconnection
     *
     * Contract:
     * - After this call the SDK returns to initial state and beginTextStream may be called again
     */
    void endTextStream() override;
    void receiveTextChunk(const std::string& data) override;
    void setComponentRenderObservable(IComponentRenderObservable* componentRenderObservable) override;
    void setSurfaceLayoutObservable(ISurfaceLayoutObservable* surfaceLayoutObservable) override;

    /**
     * @brief Component render-complete callback (triggered on main thread, posted to worker thread).
     */
    void onRenderFinish(const ComponentRenderInfo& info) override;

    /**
     * @brief Surface size change callback (triggered on main thread, posted to worker thread).
     */
    void onSurfaceSizeChanged(const SurfaceLayoutInfo& info) override;

    /**
     * @brief Sets day/night theme mode; executes on the worker thread.
     * @note Called by AGenUIEngine::setDayNightMode on the main thread
     */
    void setDayNightMode();

    EventDispatcher* getEventDispatcher();
    StreamingContentParser* getStreamingContentParser();
    SurfaceCoordinator* getSurfaceCoordinator();
    IComponentRenderObservable* getComponentRenderObservable();
    ISurfaceLayoutObservable* getSurfaceLayoutObservable();

    IThread* getMessageThread();

    bool isRunning() const { return _isRunning.load(); }

private:
    void createStreamingContentParser();
    void createSurfaceCoordinator();

    void destroySurfaceCoordinator();
    void destroyStreamingContentParser();

    int _engineId;

    // Multi-instance modules (owned)
    EventDispatcher* _dispatcher = nullptr;
    std::vector<IAGenUIMessageListener*> _cachedListeners;
    StreamingContentParser* _streamingContentParser = nullptr;
    SurfaceCoordinator* _surfaceCoordinator = nullptr;

    // External dependencies (not owned)
    IComponentRenderObservable* _componentRenderObservable = nullptr;
    ISurfaceLayoutObservable* _surfaceLayoutObservable = nullptr;

    // Running state
    std::atomic_bool _isRunning{false};
};

} // namespace agenui
