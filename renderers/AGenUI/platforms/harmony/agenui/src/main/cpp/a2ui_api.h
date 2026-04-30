#pragma once

#include <string>
#include <map>
#include <mutex>

#include <js_native_api.h>

namespace a2ui {

/**
 * A borrowed handle to an ArkTS value held by C++.
 *
 * Both fields are populated together by IHarmonyNAPI::ref() and must always
 * be treated as a pair. The handle is valid only on the JS main thread and
 * only for the duration of a single synchronous operation — it must NOT be
 * stored across asynchronous boundaries.
 *
 * Ownership: the caller does NOT own the napi_ref. It is managed by the
 * IHarmonyNAPI implementation and released when the function is unregistered.
 * Do not call napi_delete_reference on the ref field.
 *
 * Thread safety: env and ref must only be passed to NAPI functions on the
 * JS main thread. Using them on a worker thread is undefined behaviour.
 */
struct ArkTSObject {
    napi_env env;   ///< JS environment that owns the reference. nullptr on lookup failure.
    napi_ref ref;   ///< Weak reference to the ArkTS value. nullptr on lookup failure.
};

/**
 * @brief Abstraction layer between the A2UI C++ runtime and the ArkTS host.
 *
 * IHarmonyNAPI is the single seam through which C++ code looks up ArkTS
 * callbacks registered by the host application. The concrete implementation
 * (HarmonyNAPI in napi_init.cpp) maintains a name-keyed registry of ETS
 * functions and serialises access with std::mutex.
 *
 * Higher-level bridge utilities (HMHelper, ImageLoaderBridge,
 * SkillInvokerHelper) build on top of this interface rather than accessing
 * the NAPI layer directly.
 *
 * The singleton instance is created and destroyed by napi_init.cpp and
 * accessed globally via implHarmonyNAPI().
 */
class IHarmonyNAPI {
protected:
    virtual ~IHarmonyNAPI() {
    }

public:
    /**
     * @brief Look up an ArkTS function by name from the global function registry.
     *
     * Returns a borrowed handle to the ArkTS value registered under @p name
     * via the NAPI entry point RegisterEtsFunction. The handle is valid only
     * on the JS main thread and only for the duration of a single synchronous
     * call — it must NOT be stored or passed to another thread.
     *
     * @param name  The string key used when the function was registered from
     *              ArkTS (e.g. "onCreateHybridView", "onMeasure").
     *
     * @return  An ArkTSObject with non-null env and ref if the function is
     *          found, or {nullptr, nullptr} if no function with that name has
     *          been registered.
     *
     * @par Thread safety
     *   May be called from any thread. The implementation must synchronise
     *   access to the internal registry. The returned ArkTSObject must only
     *   be used (dereferenced via NAPI) on the JS main thread.
     *
     * @par Ownership
     *   The caller does NOT own the returned napi_ref. Do not call
     *   napi_delete_reference on the returned ref.
     */
    virtual ArkTSObject ref(const std::string& name) = 0;
};

/**
 * Registry entry for a single ArkTS callback registered from the ETS side.
 *
 * Stored in the global g_ets_functions_table inside napi_init.cpp.
 * Access to the table is serialised by g_ets_functions_mutex.
 *
 * Lifetime: the napi_ref is created when the function is registered via
 * RegisterFunction and deleted when it is unregistered via UnregisterFunction.
 * All NAPI operations on env/ref must occur on the JS main thread.
 */
struct EtsFunction {
    std::string name;   ///< Registration key passed to RegisterFunction.
    napi_env    env;    ///< JS environment that owns the reference.
    napi_ref    ref;    ///< Strong reference (refcount == 1) to the ArkTS function value.
};

}
