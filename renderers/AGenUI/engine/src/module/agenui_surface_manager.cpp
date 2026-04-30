#include <algorithm>
#include "agenui_surface_manager.h"
#include "agenui_log.h"
#include "agenui_type_define.h"
#include "agenui_thread_manager.h"
#include "stream/agenui_streaming_content_parser.h"
#include "surface/agenui_surface_coordinator.h"
#include "module/agenui_event_dispatcher.h"

namespace agenui {

SurfaceManager::SurfaceManager(int engineId)
    : _engineId(engineId) {
}

SurfaceManager::~SurfaceManager() {
    uninit();
}

bool SurfaceManager::enterRunning() {
    if (_isRunning.load()) {
        return false;
    }
    _isRunning.store(true);
    return true;
}

bool SurfaceManager::exitRunning() {
    if (!_isRunning.load()) {
        return false;
    }
    _isRunning.store(false);
    return true;
}

bool SurfaceManager::init() {
    // Create EventDispatcher
    _dispatcher = new EventDispatcher();
    for (const auto &listener : _cachedListeners) {
        _dispatcher->addEventListener(listener);
    }
    _cachedListeners.clear();

    // Create modules in dependency order
    createSurfaceCoordinator();
    createStreamingContentParser();

    // Register platform callbacks
    if (_componentRenderObservable) {
        _componentRenderObservable->addComponentRenderListener(this);
    }
    if (_surfaceLayoutObservable) {
        _surfaceLayoutObservable->addSurfaceLayoutListener(this);
    }
    return true;
}

void SurfaceManager::uninit() {
    // Remove all listeners first to prevent callbacks during teardown
    _cachedListeners.clear();
    if (_dispatcher) {
        _dispatcher->removeAllEventListeners();
    }

    // Unregister platform callbacks
    if (_componentRenderObservable) {
        _componentRenderObservable->removeComponentRenderListener(this);
    }
    if (_surfaceLayoutObservable) {
        _surfaceLayoutObservable->removeSurfaceLayoutListener(this);
    }

    // Destroy in strict reverse order
    destroyStreamingContentParser();
    destroySurfaceCoordinator();

    // Destroy EventDispatcher
    SAFELY_DELETE(_dispatcher);

    _componentRenderObservable = nullptr;
    _surfaceLayoutObservable = nullptr;
}

void SurfaceManager::addSurfaceEventListener(IAGenUIMessageListener* listener) {
    if (!_isRunning.load()) {
        return;
    }
    if (_dispatcher) {
        _dispatcher->addEventListener(listener);
    } else {
        _cachedListeners.push_back(listener);
    }
}

void SurfaceManager::removeSurfaceEventListener(IAGenUIMessageListener* listener) {
    if (!_isRunning.load()) {
        return;
    }
    if (_dispatcher) {
        _dispatcher->removeEventListener(listener);
    }
    // Remove from cached listeners
    if (!_cachedListeners.empty()) {
        _cachedListeners.erase(std::remove_if(_cachedListeners.begin(), _cachedListeners.end(),
            [listener](IAGenUIMessageListener* element) {
                return listener == element;
            }), _cachedListeners.end());
    }
}

void SurfaceManager::submitUIAction(const ActionMessage& msg) {
    if (!_isRunning.load()) {
        return;
    }
    IThread* messageThread = getMessageThread();
    if (!messageThread) {
        AGENUI_LOG("MessageThread is null, submitUIAction ignored");
        return;
    }
    auto self = shared_from_this();
    messageThread->post([self, msg]() {
        if (self->_surfaceCoordinator) {
            self->_surfaceCoordinator->handleAction(msg);
        }
    });
}

void SurfaceManager::submitUIDataModel(const SyncUIToDataMessage& msg) {
    if (!_isRunning.load()) {
        return;
    }
    IThread* messageThread = getMessageThread();
    if (!messageThread) {
        AGENUI_LOG("MessageThread is null, submitUIDataModel ignored");
        return;
    }
    auto self = shared_from_this();
    messageThread->post([self, msg]() {
        if (self->_surfaceCoordinator) {
            self->_surfaceCoordinator->handleSyncUIToData(msg);
        }
    });
}

void SurfaceManager::beginTextStream() {
    if (!_isRunning.load()) {
        return;
    }
    IThread* messageThread = getMessageThread();
    if (!messageThread) {
        AGENUI_LOG("MessageThread is null, beginTextStream ignored");
        return;
    }
    auto self = shared_from_this();
    messageThread->post([self]() {
        if (self->_streamingContentParser) {
            self->_streamingContentParser->processDataBeginning();
        }
    });
}

void SurfaceManager::endTextStream() {
    if (!_isRunning.load()) {
        return;
    }
    IThread* messageThread = getMessageThread();
    if (!messageThread) {
        AGENUI_LOG("MessageThread is null, endTextStream ignored");
        return;
    }
    auto self = shared_from_this();
    messageThread->post([self]() {
        if (self->_streamingContentParser) {
            self->_streamingContentParser->processDataEnding();
        }
    });
}

void SurfaceManager::receiveTextChunk(const std::string& data) {
    if (!_isRunning.load()) {
        return;
    }
    IThread* messageThread = getMessageThread();
    if (!messageThread) {
        AGENUI_LOG("MessageThread is null, receiveTextChunk ignored");
        return;
    }
    auto self = shared_from_this();
    messageThread->post([self, data]() {
        if (self->_streamingContentParser) {
            self->_streamingContentParser->processDataAssembling(data);
        }
    });
}

void SurfaceManager::onRenderFinish(const ComponentRenderInfo& info) {
    if (!_isRunning.load()) {
        return;
    }
    IThread* messageThread = getMessageThread();
    if (!messageThread) {
        AGENUI_LOG("onRenderFinish: messageThread is null, drop");
        return;
    }
    auto self = shared_from_this();
    messageThread->post([self, info]() {
        if (self->_surfaceCoordinator) {
            self->_surfaceCoordinator->handleRenderFinish(info);
        }
    });
}

void SurfaceManager::onSurfaceSizeChanged(const SurfaceLayoutInfo& info) {
    if (!_isRunning.load()) {
        return;
    }
    IThread* messageThread = getMessageThread();
    if (!messageThread) {
        AGENUI_LOG("onSurfaceSizeChanged: messageThread is null, drop");
        return;
    }
    auto self = shared_from_this();
    messageThread->post([self, info]() {
        if (self->_surfaceCoordinator) {
            self->_surfaceCoordinator->handleSurfaceSizeChanged(info);
        }
    });
}

void SurfaceManager::setDayNightMode() {
    if (!_isRunning.load()) {
        return;
    }
    IThread* messageThread = getMessageThread();
    if (!messageThread) {
        return;
    }
    auto self = shared_from_this();
    messageThread->post([self]() {
        if (self->_surfaceCoordinator) {
            self->_surfaceCoordinator->setDayNightMode();
        }
    });
}

void SurfaceManager::setComponentRenderObservable(IComponentRenderObservable* componentRenderObservable) {
    _componentRenderObservable = componentRenderObservable;
}

void SurfaceManager::setSurfaceLayoutObservable(ISurfaceLayoutObservable* surfaceLayoutObservable) {
    _surfaceLayoutObservable = surfaceLayoutObservable;
}
EventDispatcher* SurfaceManager::getEventDispatcher() {
    return _dispatcher;
}

StreamingContentParser* SurfaceManager::getStreamingContentParser() {
    return _streamingContentParser;
}

SurfaceCoordinator* SurfaceManager::getSurfaceCoordinator() {
    return _surfaceCoordinator;
}

IComponentRenderObservable* SurfaceManager::getComponentRenderObservable() {
    return _componentRenderObservable;
}

ISurfaceLayoutObservable* SurfaceManager::getSurfaceLayoutObservable() {
    return _surfaceLayoutObservable;
}

IThread* SurfaceManager::getMessageThread() {
    return ThreadManager::getInstance().getMessageThread(AGENUI_SHARED_THREAD_ID);
}

void SurfaceManager::createStreamingContentParser() {
    _streamingContentParser = new StreamingContentParser(_surfaceCoordinator);
    _streamingContentParser->start();
}

void SurfaceManager::createSurfaceCoordinator() {
    _surfaceCoordinator = new SurfaceCoordinator(this);
}
void SurfaceManager::destroySurfaceCoordinator() {
    SAFELY_DELETE(_surfaceCoordinator);
}

void SurfaceManager::destroyStreamingContentParser() {
    if (_streamingContentParser != nullptr) {
        _streamingContentParser->stop();
        SAFELY_DELETE(_streamingContentParser);
    }
}

} // namespace agenui
