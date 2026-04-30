#pragma once

#ifndef SAFELY_DELETE
#define SAFELY_DELETE(p) if (NULL != p) {delete p; p = NULL;}
#endif

// Shared worker thread ID, used by all SurfaceManager instances
#define AGENUI_SHARED_THREAD_ID 1
