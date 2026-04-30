#include "agenui_thread_manager.h"
#include "agenui_message_thread.h"
#include "agenui_log.h"
#include "agenui_type_define.h"

namespace agenui {

ThreadManager& ThreadManager::getInstance() {
    static ThreadManager instance;
    return instance;
}

ThreadManager::~ThreadManager() {
    for (auto& pair : _threads) {
        pair.second->stop();
        SAFELY_DELETE(pair.second);
    }
    _threads.clear();
}

bool ThreadManager::createThread(int engineId) {
    std::lock_guard<std::recursive_mutex> lock(_mutex);

    if (_threads.find(engineId) != _threads.end()) {
        AGENUI_LOG("ThreadManager: engineId=%d already exists", engineId);
        return true;
    }

    std::string name = "AGenUI-" + std::to_string(engineId);
    // Order: create → start → insert into map
    IThread *newThread = new MessageThread(name);
    newThread->start();
    _threads[engineId] = newThread;
    AGENUI_LOG("ThreadManager: created thread '%s'", name.c_str());
    return true;
}

void ThreadManager::destroyThread(int engineId) {
    IThread* thread = nullptr;
    // Order: remove → stop → delete (exact reverse of createThread)
    {
        std::lock_guard<std::recursive_mutex> lock(_mutex);
        auto it = _threads.find(engineId);
        if (it == _threads.end()) {
            return;
        }
        thread = it->second;
        _threads.erase(it);
    }
    thread->stop();
    SAFELY_DELETE(thread);

    AGENUI_LOG("ThreadManager: destroyed thread for engineId=%d", engineId);
}

IThread* ThreadManager::getMessageThread(int engineId) {
    std::lock_guard<std::recursive_mutex> lock(_mutex);
    auto it = _threads.find(engineId);
    if (it == _threads.end()) {
        return nullptr;
    }
    return it->second;
}

} // namespace agenui
