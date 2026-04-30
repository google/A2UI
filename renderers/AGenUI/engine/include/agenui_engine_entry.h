#pragma once

#include "agenui_engine.h"

namespace agenui {

/**
 * @brief Creates and initializes an AGenUI Engine instance
 * @return Engine instance pointer. Only one instance exists
 */
IAGenUIEngine* initAGenUIEngine();

/**
 * @brief Gets the created AGenUI Engine instance
 * @return Engine instance pointer, nullptr if not created
 */
IAGenUIEngine* getAGenUIEngine();

/**
 * @brief Destroys the AGenUI Engine instance
 */
void destroyAGenUIEngine();

} // namespace agenui
