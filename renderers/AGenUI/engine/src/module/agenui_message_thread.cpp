#include "agenui_message_thread.h"
#include "agenui_log.h"
#include <chrono>

#if defined(__APPLE__)
#include <pthread.h>
#elif defined(__linux__) || defined(__ANDROID__) || defined(__OHOS__)
#include <pthread.h>
#endif

namespace agenui {

MessageThread::MessageThread(const std::string& name) : _name(name), _isRunning(false), _shouldStop(false) {
}

MessageThread::~MessageThread() {
}

bool MessageThread::start() {
    if (_isRunning) {
        AGENUI_LOG("MessageThread already running");
        return true;
    }

    _shouldStop = false;
    _isRunning = true;

    // Start the worker thread
    _workerThread = std::thread(&MessageThread::workerThreadLoop, this);
    _threadId = _workerThread.get_id();

    AGENUI_LOG("MessageThread started, thread_id: %zu", std::hash<std::thread::id>{}(_threadId));
    return true;
}

void MessageThread::stop() {
    if (!_isRunning) {
        return;
    }

    // Signal stop
    _shouldStop = true;
    _isRunning = false;

    // Wake up the worker thread
    _condition.notify_one();

    // Drain the task queues
    {
        std::lock_guard<std::mutex> lock(_queueMutex);
        while (!_taskQueue.empty()) {
            _taskQueue.pop();
        }
        while (!_delayedTaskQueue.empty()) {
            _delayedTaskQueue.pop();
        }
    }

    // Wait for the worker thread to exit
    if (_workerThread.joinable()) {
        _workerThread.join();
    }

    AGENUI_LOG("MessageThread stopped");
}

void MessageThread::post(std::function<void()> task) {
    if (!_isRunning) {
        AGENUI_LOG("MessageThread not running, task ignored");
        return;
    }

    if (!task) {
        return;
    }

    // Enqueue the task
    {
        std::lock_guard<std::mutex> lock(_queueMutex);
        _taskQueue.push(task);
    }

    // Wake up the worker thread
    _condition.notify_one();
}

void MessageThread::postDelayed(std::function<void()> task, unsigned long delayMillis) {
    if (!_isRunning) {
        AGENUI_LOG("MessageThread not running, delayed task ignored");
        return;
    }

    if (!task) {
        return;
    }

    // Compute execution time
    auto executeTime = std::chrono::steady_clock::now() + std::chrono::milliseconds(delayMillis);

    // Enqueue the delayed task
    {
        std::lock_guard<std::mutex> lock(_queueMutex);
        _delayedTaskQueue.push({task, executeTime});
    }

    // Wake up the worker thread
    _condition.notify_one();
}

bool MessageThread::isRunning() const {
    return _isRunning;
}

std::thread::id MessageThread::getThreadId() const {
    return _threadId;
}

void MessageThread::workerThreadLoop() {
    // Set thread name for debugger identification
#if defined(__APPLE__)
    pthread_setname_np(_name.c_str());
#elif defined(__linux__) || defined(__ANDROID__) || defined(__OHOS__)
    pthread_setname_np(pthread_self(), _name.c_str());
#endif

    AGENUI_LOG("MessageThread[%s] worker loop started", _name.c_str());

    while (!_shouldStop) {
        std::function<void()> task;
        bool hasTask = false;

        // Dequeue a task
        {
            std::unique_lock<std::mutex> lock(_queueMutex);

            // Promote expired delayed tasks
            processDelayedTasks();

            // Compute wait duration
            std::chrono::milliseconds waitTime(100); // default 100ms
            if (!_delayedTaskQueue.empty()) {
                auto now = std::chrono::steady_clock::now();
                auto nextTaskTime = _delayedTaskQueue.top().executeTime;
                if (nextTaskTime > now) {
                    waitTime = std::chrono::duration_cast<std::chrono::milliseconds>(nextTaskTime - now);
                }
            }

            // Wait for a task or stop signal
            if (_taskQueue.empty() && !_shouldStop) {
                _condition.wait_for(lock, waitTime, [this] {
                    return !_taskQueue.empty() || _shouldStop;
                });
            }

            // Exit if stopped and all queues are empty
            if (_shouldStop && _taskQueue.empty() && _delayedTaskQueue.empty()) {
                break;
            }

            // Dequeue next task
            if (!_taskQueue.empty()) {
                task = _taskQueue.front();
                _taskQueue.pop();
                hasTask = true;
            }
        }

        // Execute
        if (hasTask && task) {
            task();
        }
    }

    AGENUI_LOG("MessageThread[%s] worker loop stopped", _name.c_str());
}

void MessageThread::processDelayedTasks() {
    auto now = std::chrono::steady_clock::now();

    // Move expired delayed tasks to the main queue
    while (!_delayedTaskQueue.empty()) {
        const auto& delayedTask = _delayedTaskQueue.top();
        if (delayedTask.executeTime <= now) {
            _taskQueue.push(delayedTask.task);
            _delayedTaskQueue.pop();
        } else {
            break;
        }
    }
}

} // namespace agenui
