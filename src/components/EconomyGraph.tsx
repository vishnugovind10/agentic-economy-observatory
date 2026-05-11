"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import clsx from "clsx";
import { useMemo } from "react";
import type { ObservatoryNode, ObservatoryResponse } from "@/lib/observatory-schema";

type GraphNodeData = ObservatoryNode;
type EconomyNode = Node<GraphNodeData, "observatory">;

const nodeTypeStyles: Record<ObservatoryNode["type"], string> = {
  agent: "border-cyan-300/50 bg-cyan-300/10 text-cyan-100 shadow-cyan-400/20",
  market: "border-amber-300/50 bg-amber-300/10 text-amber-100 shadow-amber-300/20",
  wallet: "border-emerald-300/50 bg-emerald-300/10 text-emerald-100 shadow-emerald-300/20",
  protocol: "border-violet-300/50 bg-violet-300/10 text-violet-100 shadow-violet-300/20",
  "trust layer": "border-teal-300/50 bg-teal-300/10 text-teal-100 shadow-teal-300/20",
  "compute layer": "border-blue-300/50 bg-blue-300/10 text-blue-100 shadow-blue-300/20",
  "governance layer": "border-rose-300/50 bg-rose-300/10 text-rose-100 shadow-rose-300/20",
  "coordination hub": "border-white/60 bg-white/10 text-white shadow-white/20",
};

const edgeColors: Record<ObservatoryResponse["graph"]["edges"][number]["type"], string> = {
  "payment flow": "#34d399",
  negotiation: "#22d3ee",
  "trust dependency": "#5eead4",
  "execution routing": "#93c5fd",
  "coordination pressure": "#fb7185",
  "liquidity flow": "#fbbf24",
};

function ObservatoryNodeCard({ data }: NodeProps<EconomyNode>) {
  return (
    <div
      className={clsx(
        "group relative w-[190px] rounded-md border px-3 py-2 shadow-[0_0_32px_var(--tw-shadow-color)] backdrop-blur-md",
        nodeTypeStyles[data.type],
      )}
    >
      <Handle className="!h-2 !w-2 !border-black !bg-white/90" type="target" position={Position.Top} />
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">{data.type}</div>
      <div className="mt-1 text-sm font-semibold leading-5">{data.label}</div>
      <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/62">{data.summary}</div>
      <div className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] z-30 hidden w-[270px] -translate-x-1/2 rounded-md border border-white/15 bg-black/90 p-3 text-left shadow-2xl shadow-black/70 group-hover:block">
        <div className="grid gap-2 text-[11px] leading-4 text-white/70">
          <p>
            <span className="text-white">Second-order:</span> {data.secondOrderEffect}
          </p>
          <p>
            <span className="text-white">Dependency:</span> {data.hiddenDependency}
          </p>
          <p>
            <span className="text-white">Delay:</span> {data.delayedConsequence}
          </p>
          <p>
            <span className="text-white">Tension:</span> {data.emergentTension}
          </p>
        </div>
      </div>
      <Handle className="!h-2 !w-2 !border-black !bg-white/90" type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = {
  observatory: ObservatoryNodeCard,
};

function layoutNodes(rawNodes: ObservatoryNode[]) {
  const centerX = 410;
  const centerY = 275;
  const typeWeight: Record<ObservatoryNode["type"], number> = {
    "coordination hub": 0.18,
    market: 0.48,
    protocol: 0.55,
    "trust layer": 0.7,
    wallet: 0.8,
    "compute layer": 0.92,
    "governance layer": 1.02,
    agent: 1.08,
  };

  return rawNodes.map((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(rawNodes.length, 1) - Math.PI / 2;
    const radius = 250 * typeWeight[node.type];

    return {
      id: node.id,
      type: "observatory",
      data: node,
      position: {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      },
    } satisfies EconomyNode;
  });
}

function mapEdges(rawEdges: ObservatoryResponse["graph"]["edges"]): Edge[] {
  return rawEdges.map((edge, index) => {
    const color = edgeColors[edge.type];

    return {
      id: `${edge.source}-${edge.target}-${index}`,
      source: edge.source,
      target: edge.target,
      animated: true,
      label: edge.label,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
      },
      style: {
        stroke: color,
        strokeOpacity: 0.35 + edge.pressure * 0.5,
        strokeWidth: 1.4 + edge.pressure * 2.4,
      },
      labelBgBorderRadius: 4,
      labelBgPadding: [5, 3],
      labelBgStyle: {
        fill: "rgba(0,0,0,0.78)",
        stroke: "rgba(255,255,255,0.12)",
      },
      labelStyle: {
        fill: "rgba(255,255,255,0.74)",
        fontSize: 10,
      },
      data: {
        consequence: edge.consequence,
      },
    };
  });
}

export function EconomyGraph({ graph }: { graph: ObservatoryResponse["graph"] }) {
  const nodes = useMemo(() => layoutNodes(graph.nodes), [graph.nodes]);
  const edges = useMemo(() => mapEdges(graph.edges), [graph.edges]);

  return (
    <div className="relative h-[540px] min-h-[420px] overflow-hidden rounded-md border border-white/10 bg-black/55">
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(20,184,166,0.08),transparent_32%,rgba(251,191,36,0.06)_58%,rgba(244,63,94,0.08))]" />
      <ReactFlow
        colorMode="dark"
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.16 }}
        minZoom={0.35}
        maxZoom={1.35}
        nodes={nodes}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(255,255,255,0.16)" gap={28} size={1} variant={BackgroundVariant.Dots} />
        <MiniMap
          className="!border !border-white/10 !bg-black/70"
          maskColor="rgba(0,0,0,0.55)"
          nodeColor={(node) => nodeTypeStyles[(node.data as GraphNodeData).type].includes("amber") ? "#fbbf24" : "#67e8f9"}
          pannable
          zoomable
        />
        <Controls className="!border !border-white/10 !bg-black/70 !shadow-none" />
      </ReactFlow>
    </div>
  );
}
