import {memo, useMemo} from 'react';
import {useA2UIComponent} from '@a2ui/react';
import type {A2UIComponentProps} from '@a2ui/react';

type DiagramNodeKind = 'start' | 'process' | 'decision' | 'end';

interface DiagramNode {
  id: string;
  label: string;
  column: number;
  lane: number;
  kind: DiagramNodeKind;
}

interface DiagramEdge {
  from_id: string;
  to_id: string;
  label?: string;
}

interface DiagramSpec {
  title: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

interface FlowDiagramNodeProps {
  spec?: {path?: string};
}

function parseSpec(raw: string | null): DiagramSpec | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DiagramSpec;
    if (!parsed.nodes || !parsed.edges) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const FlowDiagram = memo(function FlowDiagram({
  node,
  surfaceId,
}: A2UIComponentProps<any>) {
  const {getValue} = useA2UIComponent(node, surfaceId);
  const props = node.properties as FlowDiagramNodeProps;
  const spec = parseSpec(props.spec?.path ? String(getValue(props.spec.path) ?? '') : null);

  const layout = useMemo(() => {
    if (!spec) return null;
    const maxColumn = Math.max(...spec.nodes.map((item) => item.column), 0);
    const maxLane = Math.max(...spec.nodes.map((item) => item.lane), 0);
    const positions = new Map<string, {x: number; y: number}>();

    spec.nodes.forEach((item) => {
      positions.set(item.id, {
        x: item.column * 220 + 110,
        y: item.lane * 148 + 72,
      });
    });

    return {
      width: (maxColumn + 1) * 220,
      height: (maxLane + 1) * 148,
      positions,
    };
  }, [spec]);

  if (!spec || !layout) {
    return (
        <div className="flow-diagram">
          <div className="flow-diagram__empty">流程图数据暂不可用。</div>
        </div>
    );
  }

  return (
      <div className="flow-diagram">
        <div className="flow-diagram__header">
          <p className="flow-diagram__eyebrow">Flow Diagram</p>
          <h3>{spec.title}</h3>
        </div>
        <div className="flow-diagram__canvas" style={{minHeight: layout.height}}>
          <svg
              className="flow-diagram__edges"
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              preserveAspectRatio="xMinYMin meet"
          >
            <defs>
              <marker
                  id="flow-diagram-arrow"
                  markerWidth="10"
                  markerHeight="10"
                  refX="8"
                  refY="5"
                  orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
              </marker>
            </defs>
            {spec.edges.map((edge) => {
              const from = layout.positions.get(edge.from_id);
              const to = layout.positions.get(edge.to_id);
              if (!from || !to) return null;
              const midX = (from.x + to.x) / 2;
              const path = `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
              return (
                  <g key={`${edge.from_id}-${edge.to_id}-${edge.label ?? ''}`}>
                    <path
                        d={path}
                        className="flow-diagram__edge-path"
                        markerEnd="url(#flow-diagram-arrow)"
                    />
                    {edge.label ? (
                        <text x={midX} y={(from.y + to.y) / 2 - 10} className="flow-diagram__edge-label">
                          {edge.label}
                        </text>
                    ) : null}
                  </g>
              );
            })}
          </svg>

          {spec.nodes.map((item) => (
              <div
                  key={item.id}
                  className={`flow-diagram__node flow-diagram__node--${item.kind}`}
                  style={{
                    left: item.column * 220 + 20,
                    top: item.lane * 148 + 20,
                  }}
              >
                <span className="flow-diagram__node-kind">{item.kind}</span>
                <strong>{item.label}</strong>
              </div>
          ))}
        </div>
      </div>
  );
});

