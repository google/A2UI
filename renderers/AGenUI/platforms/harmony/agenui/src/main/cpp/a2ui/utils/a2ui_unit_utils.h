#pragma once

/**
 * Unit conversion utilities for the A2UI layout system.
 *
 * A2UI uses three distinct length units that map to HarmonyOS rendering units as follows:
 *
 *   px   — Physical pixels. Device-specific and density-dependent.
 *            Example: on a 3x density screen, 1 physical pixel is 1/3 of a vp.
 *
 *   vp   — Density-independent virtual pixels, equivalent to HarmonyOS vp.
 *            Defined as: vp = px / density
 *            Example: a2uiToVp(360) == 180.0f  (360 a2ui units → 180 vp)
 *
 *   a2ui — A2UI design unit. Defined as exactly 2 vp.
 *            The design canvas is authored at 2× the HarmonyOS vp resolution,
 *            so all a2ui values are halved before being passed to ArkUI CAPI.
 *            Defined as: a2ui = 2 * vp  →  vp = a2ui / 2
 *            Example: a2uiToVp(200) == 100.0f  (200 a2ui → 100 vp)
 *
 * Conversion summary:
 *   a2ui → vp  : value / 2
 *   vp → a2ui  : value * 2
 *   px → vp    : value / density
 *   px → a2ui  : value / density * 2
 *   a2ui → px  : value / 2 * density
 *
 * gDensityForUI must be initialised once at startup from the device screen density
 * (e.g. from OH_NativeWindow_NativeWindowHandleOpt or Display.getDensityPixels).
 * All conversion functions are undefined if gDensityForUI is 0.
 */
extern float gDensityForUI;

namespace a2ui {
class UnitConverter {
public:
    /**
     * Convert a2ui units to HarmonyOS vp.
     *
     * Formula: vp = a2ui / 2
     * Example: a2uiToVp(360.0f) == 180.0f
     */
    static float a2uiToVp(float value) { return value / 2; }

    /**
     * Convert HarmonyOS vp to a2ui units.
     *
     * Formula: a2ui = vp * 2
     * Example: vpToA2ui(100.0f) == 200.0f
     */
    static float vpToA2ui(float value) { return value * 2; }

    /**
     * Convert physical pixels (px) to a2ui units.
     *
     * Formula: a2ui = (px / density) * 2
     * Example on a 3× display: pxToA2ui(300.0f) == 200.0f
     */
    static float pxToA2ui(float value) { return value / gDensityForUI * 2; }

    /**
     * Convert physical pixels (px) to HarmonyOS vp.
     *
     * Formula: vp = px / density
     * Example on a 3× display: pxToVp(300.0f) == 100.0f
     */
    static float pxToVp(float value) { return value / gDensityForUI; }

    /**
     * Convert a2ui units to physical pixels (px).
     *
     * Formula: px = (a2ui / 2) * density
     * Example on a 3× display: a2uiToPx(200.0f) == 300.0f
     */
    static float a2uiToPx(float value) { return value / 2 * gDensityForUI; }
};
}
