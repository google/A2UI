#pragma once

#include "agenui_ithread.h"
#include <atomic>
#include <mutex>
#include <string>
#include <thread>
#include <queue>
#include <condition_variable>

namespace agenui {

/**
 * @brief Message thread
 *
 * Thread safety:
 * - Task queue is protected by a mutex
 * - Thread synchronization uses a condition variable
 * - Supports graceful start and stop
 */
class MessageThread : public IThread {
public:
    explicit MessageThread(const std::string& name);
    ~MessageThread();

    /**
     * @brief Starts the thread.
     * @return true if started successfully
     */
    bool start() override;

    /**
     * @brief Stops the thread.
     */
    void stop() override;

    /**
     * @brief Returns whether the thread is running.
     * @return true if running
     */
    bool isRunning() const override;

    /**
     * @brief Posts a task.
     * @param task Task function to execute
     */
    void post(std::function<void()> task) override;

    /**
     * @brief Posts a task with a delay.
     * @param task Task function to execute
     * @param delayMillis Delay in milliseconds
     */
    void postDelayed(std::function<void()> task, unsigned long delayMillis) override;

    /**
     * @brief Returns the thread ID.
     */
    std::thread::id getThreadId() const;

    /**
     * @brief Main loop of the worker thread.
     */
    void workerThreadLoop();

    /**
     * @brief Processes expired delayed tasks.
     */
    void processDelayedTasks();

    struct DelayedTask {
        std::function<void()> task;
        std::chrono::steady_clock::time_point executeTime;

        bool operator>(const DelayedTask& other) const {
            return executeTime > other.executeTime;
        }
    };

    std::string _name;                                              // thread name
    std::thread _workerThread;                                      // worker thread
    std::queue<std::function<void()>> _taskQueue;                   // task queue
    std::priority_queue<DelayedTask, std::vector<DelayedTask>,
                        std::greater<DelayedTask>> _delayedTaskQueue; // delayed task queue
    std::mutex _queueMutex;                                         // queue mutex
    std::condition_variable _condition;                             // condition variable
    std::atomic_bool _isRunning;                                    // running flag
    std::atomic_bool _shouldStop;                                   // stop flag
    std::thread::id _threadId;                                      // thread ID
};

} // namespace agenui
