/**
 * A2UI renderer adapter.
 *
 * All composer code imports from this file instead of the renderer package
 * directly. Switches between v0.8 and v0.9 renderers based on specVersion.
 *
 * v0.8: Uses A2UIViewer from @a2ui/react with the viewerTheme and
 *       CSS palette variables from globals.css.
 * v0.9: Uses V09Viewer which creates a SurfaceModel and renders via
 *       A2uiSurface from @a2ui/react/v0_9. Loaded dynamically (client-only)
 *       because A2uiSurface uses useSyncExternalStore without a server snapshot.
 */
'use client';

import dynamic from "next/dynamic";
import { A2UIViewer as BaseA2UIViewer } from "@a2ui/react";
import type { ComponentProps } from "react";
import { viewerTheme } from "./viewerTheme";
import type { SpecVersion } from "@/types/widget";

const V09Viewer = dynamic(() => import("./v09Viewer").then(m => ({ default: m.V09Viewer })), {
  ssr: false,
});

export type { ComponentInstance } from "@a2ui/react";

type BaseProps = ComponentProps<typeof BaseA2UIViewer>;

export interface A2UIViewerProps extends BaseProps {
  specVersion?: SpecVersion;
}

export function A2UIViewer({ specVersion = '0.8', ...props }: A2UIViewerProps) {
  if (specVersion === '0.9') {
    return (
      <V09Viewer
        root={props.root}
        components={props.components as unknown as Array<{ id: string; component: string; [key: string]: unknown }>}
        data={props.data}
        onAction={props.onAction as ((action: unknown) => void) | undefined}
      />
    );
  }

  return <BaseA2UIViewer theme={viewerTheme} {...props} />;
}
