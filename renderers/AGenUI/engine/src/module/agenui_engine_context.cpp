#include "agenui_engine_context.h"

namespace agenui {

static IEngineContext* s_engineContext = nullptr;

IEngineContext* getEngineContext() {
    return s_engineContext;
}

void setEngineContext(IEngineContext* ctx) {
    s_engineContext = ctx;
}

} // namespace agenui
