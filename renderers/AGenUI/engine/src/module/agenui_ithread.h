#pragma once

#include <functional>

namespace agenui {

/**
 * @brief Thread interface
 *
 * Defines basic thread operations.
 * Implemented by MessageThread for async task processing.
 *
 * Usage:
 * @code
 * IThread* messageThread = threadManager->getMessageThread();
 * if (messageThread) {
 *     messageThread->post([=] {
 *         // Task to execute on the message thread
 *     });
 * }
 * @endcode
 */
class IThread {
public:
    virtual ~IThread() = default;

    /**
     * @brief Starts the message thread.
     * @return true if started successfully
     */
    virtual bool start() = 0;

    /**
     * @brief Stops the message thread.
     */
    virtual void stop() = 0;

    /**
     * @brief Returns whether the thread is running.
     * @return true if running
     */
    virtual bool isRunning() const = 0;

    /**
     * @brief Posts a task to the thread.
     * @param task Task function to execute
     */
    virtual void post(std::function<void()> task) = 0;

    /**
     * @brief Posts a delayed task to the thread.
     * @param task Task function to execute
     * @param delayMillis Delay in milliseconds
     */
    virtual void postDelayed(std::function<void()> task, unsigned long delayMillis) = 0;
};

} // namespace agenui
