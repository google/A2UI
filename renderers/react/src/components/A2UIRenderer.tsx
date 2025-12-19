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

import React, { useMemo, type ReactNode } from "react";
import { Types } from "@a2ui/lit/0.8";
import { useA2UI } from "../hooks/useA2UI.js";
import { cn } from "../lib/utils.js";
import { Text, Image, Icon, Video, AudioPlayer, Divider } from "./content/index.js";
import { Row, Column, List, Card, Tabs, Modal } from "./layout/index.js";
import { Button, CheckBox, TextField, DateTimeInput, MultipleChoice, Slider } from "./interactive/index.js";

export interface A2UIRendererProps {
  surfaceId: string;
  className?: string;
  fallback?: ReactNode;
}

export function A2UIRenderer({
  surfaceId,
  className,
  fallback = null,
}: A2UIRendererProps) {
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
  const renderChild = useMemo(
    () => (childNode: Types.AnyComponentNode) => (
      <ComponentRenderer
        key={childNode.id}
        node={childNode}
        surfaceId={surfaceId}
      />
    ),
    [surfaceId]
  );

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
    case "Text":
      return <Text node={node as Types.AnyComponentNode & { type: "Text" }} surfaceId={surfaceId} />;

    case "Image":
      return <Image node={node as Types.AnyComponentNode & { type: "Image" }} surfaceId={surfaceId} />;

    case "Icon":
      return <Icon node={node as Types.AnyComponentNode & { type: "Icon" }} surfaceId={surfaceId} />;

    case "Video":
      return <Video node={node as Types.AnyComponentNode & { type: "Video" }} surfaceId={surfaceId} />;

    case "AudioPlayer":
      return <AudioPlayer node={node as Types.AnyComponentNode & { type: "AudioPlayer" }} surfaceId={surfaceId} />;

    case "Divider":
      return <Divider node={node as Types.AnyComponentNode & { type: "Divider" }} surfaceId={surfaceId} />;

    case "Row":
      return (
        <Row node={node as Types.AnyComponentNode & { type: "Row" }} surfaceId={surfaceId}>
          {children}
        </Row>
      );

    case "Column":
      return (
        <Column node={node as Types.AnyComponentNode & { type: "Column" }} surfaceId={surfaceId}>
          {children}
        </Column>
      );

    case "List":
      return (
        <List node={node as Types.AnyComponentNode & { type: "List" }} surfaceId={surfaceId}>
          {children}
        </List>
      );

    case "Card":
      return (
        <Card node={node as Types.AnyComponentNode & { type: "Card" }} surfaceId={surfaceId}>
          {children}
        </Card>
      );

    case "Tabs":
      return (
        <Tabs
          node={node as Types.AnyComponentNode & { type: "Tabs" }}
          surfaceId={surfaceId}
          renderChild={renderChild}
        />
      );

    case "Modal":
      return (
        <Modal
          node={node as Types.AnyComponentNode & { type: "Modal" }}
          surfaceId={surfaceId}
          renderChild={renderChild}
        />
      );

    case "Button":
      return (
        <Button node={node as Types.AnyComponentNode & { type: "Button" }} surfaceId={surfaceId}>
          {children}
        </Button>
      );

    case "CheckBox":
      return <CheckBox node={node as Types.AnyComponentNode & { type: "CheckBox" }} surfaceId={surfaceId} />;

    case "TextField":
      return <TextField node={node as Types.AnyComponentNode & { type: "TextField" }} surfaceId={surfaceId} />;

    case "DateTimeInput":
      return <DateTimeInput node={node as Types.AnyComponentNode & { type: "DateTimeInput" }} surfaceId={surfaceId} />;

    case "MultipleChoice":
      return <MultipleChoice node={node as Types.AnyComponentNode & { type: "MultipleChoice" }} surfaceId={surfaceId} />;

    case "Slider":
      return <Slider node={node as Types.AnyComponentNode & { type: "Slider" }} surfaceId={surfaceId} />;

    default:
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
