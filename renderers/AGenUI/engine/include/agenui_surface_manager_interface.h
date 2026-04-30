#pragma once

#include <string>

namespace agenui {

class IAGenUIMessageListener;
class IComponentRenderObservable;
class ISurfaceLayoutObservable;
struct ActionMessage;
struct SyncUIToDataMessage;

/**
 * @brief SurfaceManager external interface
 *
 * Multi-instance context manager. Each ISurfaceManager corresponds to an independent UI rendering context,
 * with independent card management, data binding, protocol parsing, and event callback chains.
 * Lifecycle is managed by IAGenUIEngine:
 * - Created via IAGenUIEngine::createSurfaceManager()
 * - Destroyed via IAGenUIEngine::destroySurfaceManager()
 *
 * Thread convention:
 * - All external interfaces are called on the business thread
 * - Internal logic is processed on a sub-thread (shared by all SurfaceManager instances), event callbacks to listener are on the sub-thread
 * Data isolation note:
 *  - Each SurfaceManager has independent streaming data buffers and callbacks; different data streams can be bound to different SurfaceManager instances
 */
class ISurfaceManager {
public:
    virtual ~ISurfaceManager() = default;
    /**
     * @brief Gets the Engine ID (instance identifier)
     * @return The unique ID assigned at creation
     */
    virtual int getEngineId() const = 0;
    /**
     * @brief Adds a Surface event listener (internally locked)
     * @param listener Listener pointer (lifecycle managed by the caller)
     */
    virtual void addSurfaceEventListener(IAGenUIMessageListener* listener) = 0;

    /**
     * @brief Removes a Surface event listener (internally locked)
     * @param listener Listener pointer
     * @remark Recommended to call actively before destruction. Engine internal event sending functions are also locked
     */
    virtual void removeSurfaceEventListener(IAGenUIMessageListener* listener) = 0;

    /**
     * @brief Triggers a UI action
     * @param msg Action message
     * @remark Replaces the original EventDispatcher::dispatchAction
     */
    virtual void submitUIAction(const ActionMessage& msg) = 0;

    /**
     * @brief Syncs UI operation data to the data record
     * @param msg SyncUIToData message
     * @remark Replaces the original EventDispatcher::dispatchSyncUIToData
     */
    virtual void submitUIDataModel(const SyncUIToDataMessage& msg) = 0;

    /**
     * @brief Begins a round of A2UI protocol streaming data reception
     *
     * Called by the business side before starting a new round of streaming data transmission.
     * The SDK will clear the internal buffer and reset the parsing state.
     *
     * Call timing:
     * - Before a new round of streaming data begins
     * - Before the first call to receiveTextChunk
     *
     * Interface contract:
     * - Recommended call sequence: beginTextStream → receiveTextChunk × N → endTextStream
     * - If receiveTextChunk is called directly without calling this method, the SDK still works (compatibility mode),
     *   but residual state from the previous round may not be cleaned up
     *
     * Thread convention: Call on the same thread as receiveTextChunk
     */
    virtual void beginTextStream() = 0;

    /**
     * @brief Ends a round of A2UI protocol streaming data reception session
     *
     * Called by the business side after all streaming data in a round has been sent.
     * The SDK will check for any unparseable residual data, clear the buffer, and reset the parsing state.
     *
     * Call timing:
     * - SSE stream normally closes (stream close / EOF)
     * - HTTP response ends
     * - User actively aborts the current conversation
     * - Cleanup after abnormal network disconnection
     *
     * Interface contract:
     * - After calling, the SDK returns to its initial state and can safely start the next round of beginTextStream
     */
    virtual void endTextStream() = 0;
    /**
     * @brief Receives A2UI protocol data
     * @param data A2UI protocol data string
     * @remark Replaces the original transmitRawProtocolStreaming
     */
    virtual void receiveTextChunk(const std::string& data) = 0;

    /**
     * @brief Sets the Markdown service
     * @param componentRenderObservable Markdown service interface pointer
     */
    virtual void setComponentRenderObservable(IComponentRenderObservable* componentRenderObservable) = 0;

    /**
     * @brief Sets the Surface service
     * @param surfaceLayoutObservable Surface service interface pointer
     */
    virtual void setSurfaceLayoutObservable(ISurfaceLayoutObservable* surfaceLayoutObservable) = 0;
};

} // namespace agenui
