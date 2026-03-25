/**
 * A2UI renderer adapter.
 *
 * All composer code imports from this file instead of the renderer package
 * directly. When we add a v0.8/v0.9 version switcher, only this file needs
 * to change.
 *
 * The default litTheme uses CSS variable classes (color-bgc-p30, etc.) that
 * require --p-*, --n-*, --s-* palettes to be defined. These are provided
 * via globals.css on .a2ui-surface.
 */
'use client';

import { A2UIViewer as BaseA2UIViewer } from "@a2ui/react";
import type { ComponentProps } from "react";
import { viewerTheme } from "./viewerTheme";

export type { ComponentInstance } from "@a2ui/react";

type A2UIViewerProps = ComponentProps<typeof BaseA2UIViewer>;

export function A2UIViewer(props: A2UIViewerProps) {
  return <BaseA2UIViewer theme={viewerTheme} {...props} />;
}
