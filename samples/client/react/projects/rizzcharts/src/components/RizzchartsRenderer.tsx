/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { useMemo, type ReactNode } from "react";
import { Types, useA2UI, cn, useDataBinding, Primitives } from "@a2ui/react";
import { Chart } from "./Chart";
import { GoogleMapComponent } from "./GoogleMap";

export interface RizzchartsRendererProps {
  surfaceId: string;
  className?: string;
  fallback?: ReactNode;
}

export function RizzchartsRenderer({
  surfaceId,
  className,
  fallback = null,
}: RizzchartsRendererProps) {
  const { getSurface } = useA2UI();

  const surface = getSurface(surfaceId);
  const componentTree = surface?.componentTree;

  if (!componentTree) {
    return <>{fallback}</>;
  }

  return (
    <div className={cn("a2ui-surface", className)}>
      <ComponentRenderer node={componentTree} surfaceId={surfaceId} />
    </div>
  );
}

interface ComponentRendererProps {
  node: Types.AnyComponentNode;
  surfaceId: string;
}

function ComponentRenderer({ node, surfaceId }: ComponentRendererProps) {
  const children = useMemo(() => {
    const props = node.properties as {
      children?: Types.AnyComponentNode[];
      child?: Types.AnyComponentNode;
    };

    if (props.children && Array.isArray(props.children)) {
      return props.children.map((child) =>
        child ? (
          <ComponentWrapper key={child.id} node={child}>
            <ComponentRenderer node={child} surfaceId={surfaceId} />
          </ComponentWrapper>
        ) : null
      );
    }

    if (props.child) {
      return (
        <ComponentWrapper key={props.child.id} node={props.child}>
          <ComponentRenderer node={props.child} surfaceId={surfaceId} />
        </ComponentWrapper>
      );
    }

    return null;
  }, [node.properties, surfaceId]);

  switch (node.type) {
    case "Chart":
      return <Chart node={node as any} surfaceId={surfaceId} />;

    case "GoogleMap":
      return <GoogleMapComponent node={node as any} surfaceId={surfaceId} />;

    case "Canvas":
      return (
        <div
          className="a2ui-canvas"
          style={{
            width: "100%",
            minHeight: "400px",
            display: "flex",
            flexDirection: "column",
            padding: "24px",
          }}
        >
          {children}
        </div>
      );

    case "Row":
      return (
        <div
          className="a2ui-row"
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "16px",
            alignItems: "stretch",
          }}
        >
          {children}
        </div>
      );

    case "Column":
      return (
        <div
          className="a2ui-column"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            alignItems: "center",
            width: "100%",
          }}
        >
          {children}
        </div>
      );

    case "Text":
      return <TextComponent node={node} surfaceId={surfaceId} />;

    case "Card":
      return (
        <div
          className="a2ui-card"
          style={{
            padding: "20px",
            borderRadius: "12px",
            backgroundColor: "var(--a2ui-surface-container, #1e1e2e)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          {children}
        </div>
      );

    case "List":
      return (
        <div
          className="a2ui-list"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            width: "100%",
          }}
        >
          {children}
        </div>
      );

    default:
      if (children) {
        return <>{children}</>;
      }
      console.warn(`Unknown component type: ${node.type}`);
      return null;
  }
}

function ComponentWrapper({
  node,
  children,
}: {
  node: Types.AnyComponentNode;
  children: ReactNode;
}) {
  const style = useMemo(() => {
    const weight = node.weight;
    if (typeof weight !== "number") {
      return undefined;
    }
    return { flex: weight };
  }, [node.weight]);

  if (!style) {
    return <>{children}</>;
  }

  return <div style={style}>{children}</div>;
}

interface TextComponentProps {
  node: Types.AnyComponentNode;
  surfaceId: string;
}

function TextComponent({ node, surfaceId }: TextComponentProps) {
  const { resolveString } = useDataBinding(node, surfaceId);
  const properties = node.properties as {
    text?: Primitives.StringValue;
    usageHint?: string;
  };

  const text = resolveString(properties.text ?? null) ?? "";
  const usageHint = properties.usageHint;

  if (usageHint === "h1") {
    return <h1 className="a2ui-text a2ui-h1" style={{ margin: 0, fontSize: "28px", fontWeight: 600 }}>{text}</h1>;
  }
  if (usageHint === "h2") {
    return <h2 className="a2ui-text a2ui-h2" style={{ margin: 0, fontSize: "22px", fontWeight: 600 }}>{text}</h2>;
  }
  if (usageHint === "h3") {
    return <h3 className="a2ui-text a2ui-h3" style={{ margin: 0, fontSize: "18px", fontWeight: 500 }}>{text}</h3>;
  }

  return <span className="a2ui-text">{text}</span>;
}
