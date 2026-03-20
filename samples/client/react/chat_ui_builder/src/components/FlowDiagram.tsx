import {memo, useEffect, useMemo, useRef, useState} from 'react';
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

interface SpecBinding {
  path?: string;
  literal?: unknown;
  literalString?: string;
  valueString?: string;
}

interface FlowDiagramNodeProps {
  spec?: string | DiagramSpec | SpecBinding;
}

function isDiagramSpec(value: unknown): value is DiagramSpec {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<DiagramSpec>;
  return typeof candidate.title === 'string' && Array.isArray(candidate.nodes) && Array.isArray(candidate.edges);
}

function extractSpecCandidate(value: unknown): string | DiagramSpec | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (isDiagramSpec(value)) return value;
  if (typeof value !== 'object') return String(value);

  const binding = value as SpecBinding;
  if (typeof binding.literalString === 'string') return binding.literalString;
  if (typeof binding.valueString === 'string') return binding.valueString;
  if (binding.literal != null) return extractSpecCandidate(binding.literal);

  return null;
}

function parseSpec(raw: string | DiagramSpec | null): DiagramSpec | null {
  if (!raw) return null;
  if (isDiagramSpec(raw)) return raw;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isDiagramSpec(parsed) ? parsed : null;
  } catch (error) {
    console.warn('[FlowDiagram] Failed to parse spec payload:', error, raw);
    return null;
  }
}

export const FlowDiagram = memo(function FlowDiagram({
  node,
  surfaceId,
}: A2UIComponentProps<any>) {
  const {getValue} = useA2UIComponent(node, surfaceId);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const props = node.properties as FlowDiagramNodeProps;
  const rawSpecValue =
    props.spec && typeof props.spec === 'object' && 'path' in props.spec && props.spec.path
      ? getValue(props.spec.path)
      : props.spec;
  const specSource = extractSpecCandidate(rawSpecValue);
  const spec = parseSpec(specSource);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    const updateWidth = () => setCanvasWidth(element.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(() => {
    if (!spec) return null;
    const maxColumn = Math.max(...spec.nodes.map((item) => item.column), 0);
    const maxLane = Math.max(...spec.nodes.map((item) => item.lane), 0);
    const columnCount = maxColumn + 1;
    const laneCount = maxLane + 1;
    const paddingX = 20;
    const paddingY = 20;
    const columnGap = columnCount >= 6 ? 12 : columnCount >= 4 ? 18 : 26;
    const rowGap = 32;
    const fallbackNodeWidth = 168;
    const availableWidth =
      canvasWidth > 0
        ? canvasWidth - paddingX * 2 - Math.max(0, columnCount - 1) * columnGap
        : columnCount * fallbackNodeWidth;
    const nodeWidth = Math.max(96, Math.min(176, availableWidth / columnCount));
    const nodeHeight = 96;
    const width = paddingX * 2 + nodeWidth * columnCount + Math.max(0, columnCount - 1) * columnGap;
    const height = paddingY * 2 + nodeHeight * laneCount + Math.max(0, laneCount - 1) * rowGap;
    const positions = new Map<string, {x: number; y: number}>();

    spec.nodes.forEach((item) => {
      positions.set(item.id, {
        x: paddingX + item.column * (nodeWidth + columnGap) + nodeWidth / 2,
        y: paddingY + item.lane * (nodeHeight + rowGap) + nodeHeight / 2,
      });
    });

    return {
      width,
      height,
      nodeWidth,
      nodeHeight,
      positions,
    };
  }, [canvasWidth, spec]);

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
        <div ref={canvasRef} className="flow-diagram__canvas" style={{minHeight: layout.height}}>
          <svg
              className="flow-diagram__edges"
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              preserveAspectRatio="xMinYMin meet"
          >
            <defs>
              <marker
                  id={`flow-diagram-arrow-${node.id}`}
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
              const labelWidth = Math.max(42, (edge.label?.length ?? 0) * 16);
              const path = `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
              return (
                  <g key={`${edge.from_id}-${edge.to_id}-${edge.label ?? ''}`}>
                    <path
                        d={path}
                        className="flow-diagram__edge-path"
                        markerEnd={`url(#flow-diagram-arrow-${node.id})`}
                    />
                    {edge.label ? (
                        <g transform={`translate(${midX}, ${(from.y + to.y) / 2 - 12})`}>
                          <rect
                              className="flow-diagram__edge-label-bg"
                              x={-labelWidth / 2}
                              y={-14}
                              rx="999"
                              width={labelWidth}
                              height="28"
                          />
                          <text x="0" y="5" className="flow-diagram__edge-label">
                            {edge.label}
                          </text>
                        </g>
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
                    left: layout.positions.get(item.id)!.x - layout.nodeWidth / 2,
                    top: layout.positions.get(item.id)!.y - layout.nodeHeight / 2,
                    width: layout.nodeWidth,
                    minHeight: layout.nodeHeight,
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
