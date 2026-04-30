#pragma once

#include "agenui_ithread.h"
#include <mutex>
#include <unordered_map>

namespace agenui {

/**
 * @brief Thread manager (singleton)
 *
 * Manages worker threads for each AGenUI engine instance.
 * Each engine instance is identified by a unique engineId and owns an independent MessageThread.
 *
 * Thread safety:
 * - Thread map is protected by a mutex
 * - Thread creation and destruction are managed centrally
 */
class ThreadManager {
public:
    /**
     * @brief Returns the singleton instance.
     */
    static ThreadManager& getInstance();

    /**
     * @brief Creates a worker thread for the given engine instance.
     * @param engineId Engine instance ID
     * @return true if successful
     */
    bool createThread(int engineId);

    /**
     * @brief Destroys the worker thread for the given engine instance.
     * @param engineId Engine instance ID
     */
    void destroyThread(int engineId);

    /**
     * @brief Returns the message thread for the given engine instance.
     * @param engineId Engine instance ID
     * @return Thread pointer, or nullptr if not started
     */
    IThread* getMessageThread(int engineId);

private:
    ThreadManager() = default;
    ~ThreadManager();
    ThreadManager(const ThreadManager&) = delete;
    ThreadManager& operator=(const ThreadManager&) = delete;

    std::unordered_map<int, IThread*> _threads;
    std::recursive_mutex _mutex;
};

} // namespace agenui
