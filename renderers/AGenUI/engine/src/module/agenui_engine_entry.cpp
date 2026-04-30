#include "agenui_engine_entry.h"
#include <atomic>
#include "agenui_engine_impl.h"
#include "agenui_log.h"
#include "agenui_type_define.h"

namespace agenui {

// Global engine instance
static std::atomic<AGenUIEngine*> g_agenUIEngine(nullptr);

IAGenUIEngine* initAGenUIEngine() {
    if (g_agenUIEngine) {
        return g_agenUIEngine;
    }
    
    auto* engine = new AGenUIEngine();
    engine->start();
    g_agenUIEngine = engine;
    AGENUI_LOG("engine:%p", g_agenUIEngine.load());
    return g_agenUIEngine;
}

IAGenUIEngine* getAGenUIEngine() {
    return g_agenUIEngine;
}

void destroyAGenUIEngine() {
    auto* engine = g_agenUIEngine.load();
    AGENUI_LOG("engine:%p", engine);
    g_agenUIEngine = nullptr;
    if (engine) {
        engine->stop();
        SAFELY_DELETE(engine);
    }
}

} // namespace agenui
