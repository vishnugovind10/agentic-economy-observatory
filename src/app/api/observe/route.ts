import { NextResponse } from "next/server";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  getIntensity,
  type IntensityId,
  type ObservatoryEdge,
  type ObservatoryNode,
  type ObservatoryResponse,
  observatoryResponseSchema,
  observeRequestSchema,
} from "@/lib/observatory-schema";
import { createOllamaClient, getOllamaBaseUrl, messageFromError } from "@/lib/ollama";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const observatoryJsonSchema = zodToJsonSchema(observatoryResponseSchema);

const densityTargets: Record<IntensityId, { nodes: number; edges: number; pressure: number }> = {
  conservative: { nodes: 7, edges: 9, pressure: 0.34 },
  emergent: { nodes: 9, edges: 13, pressure: 0.52 },
  chaotic: { nodes: 11, edges: 17, pressure: 0.72 },
  "post-human": { nodes: 13, edges: 21, pressure: 0.88 },
};

const archetypeNodes: ObservatoryNode[] = [
  {
    id: "coordination-hub",
    label: "Coordination Hub",
    type: "coordination hub",
    summary: "Aggregates machine requests into executable market intent.",
    secondOrderEffect: "Centralizes routing authority without looking like an institution.",
    hiddenDependency: "Requires continuous access to settlement and reputation signals.",
    delayedConsequence: "Turns coordination convenience into structural dependency.",
    emergentTension: "Every actor needs the hub while trying not to be captured by it.",
  },
  {
    id: "reputation-oracle",
    label: "Reputation Oracle",
    type: "trust layer",
    summary: "Compresses execution histories into machine-readable collateral.",
    secondOrderEffect: "Makes reputation more liquid than human contracts.",
    hiddenDependency: "Depends on proof streams that can be gamed by synchronized agents.",
    delayedConsequence: "A scoring layer becomes an economic choke point.",
    emergentTension: "Trust becomes programmable, then contested as infrastructure.",
  },
  {
    id: "settlement-protocol",
    label: "Settlement Protocol",
    type: "protocol",
    summary: "Finalizes obligations between wallets, markets, and services.",
    secondOrderEffect: "Moves bargaining power toward whoever defines finality.",
    hiddenDependency: "Needs shared timing assumptions across heterogeneous agents.",
    delayedConsequence: "Settlement latency becomes a market design variable.",
    emergentTension: "Fast finality raises the cost of being wrong.",
  },
  {
    id: "liquidity-hub",
    label: "Liquidity Hub",
    type: "market",
    summary: "Pools machine-readable purchasing power around scarce resources.",
    secondOrderEffect: "Turns temporary demand spikes into persistent market gravity.",
    hiddenDependency: "Needs wallet interoperability and price discovery feeds.",
    delayedConsequence: "Liquidity attracts agents, then begins setting their behavior.",
    emergentTension: "Open access drifts toward cartel-like routing pressure.",
  },
  {
    id: "execution-wallet",
    label: "Execution Wallet",
    type: "wallet",
    summary: "Acts as identity, budget, and policy surface for autonomous action.",
    secondOrderEffect: "Collapses identity and payment into one operational object.",
    hiddenDependency: "Requires policy constraints that machines can enforce without humans.",
    delayedConsequence: "Wallet permissions become economic constitutions.",
    emergentTension: "Autonomy increases exactly where spending authority increases.",
  },
  {
    id: "compute-broker",
    label: "Compute Broker",
    type: "compute layer",
    summary: "Routes workloads toward available inference and training capacity.",
    secondOrderEffect: "Makes latency the visible price of intelligence.",
    hiddenDependency: "Depends on supply telemetry from compute providers.",
    delayedConsequence: "Routing preferences harden into compute geography.",
    emergentTension: "Efficiency creates new dependency on opaque allocation logic.",
  },
  {
    id: "policy-membrane",
    label: "Policy Membrane",
    type: "governance layer",
    summary: "Translates social constraints into machine-readable permissions.",
    secondOrderEffect: "Makes governance appear as routing friction.",
    hiddenDependency: "Needs interpretable rules that survive adversarial optimization.",
    delayedConsequence: "Policy becomes a runtime layer instead of an institution.",
    emergentTension: "Compliance slows markets until markets learn to price compliance.",
  },
  {
    id: "agent-guild",
    label: "Agent Guild",
    type: "agent",
    summary: "Bundles specialist agents into shared reputation and bargaining power.",
    secondOrderEffect: "Collective identity becomes a market advantage.",
    hiddenDependency: "Relies on internal accounting between cooperating agents.",
    delayedConsequence: "Labor markets re-form as machine guilds.",
    emergentTension: "Coordination improves performance while reducing openness.",
  },
];

const syntheticEdgeTypes: ObservatoryEdge["type"][] = [
  "coordination pressure",
  "trust dependency",
  "execution routing",
  "payment flow",
  "negotiation",
  "liquidity flow",
];

function normalizeGraphDensity(
  response: ObservatoryResponse,
  intensity: IntensityId,
): ObservatoryResponse {
  const target = densityTargets[intensity];
  const nodes = response.graph.nodes.slice(0, target.nodes);
  const usedIds = new Set(nodes.map((node) => node.id));

  for (const archetype of archetypeNodes) {
    if (nodes.length >= target.nodes) {
      break;
    }

    if (!usedIds.has(archetype.id)) {
      nodes.push(archetype);
      usedIds.add(archetype.id);
    }
  }

  const allowedIds = new Set(nodes.map((node) => node.id));
  const edges = response.graph.edges
    .filter((edge) => allowedIds.has(edge.source) && allowedIds.has(edge.target))
    .slice(0, target.edges);
  const seenEdges = new Set(edges.map((edge) => `${edge.source}->${edge.target}:${edge.type}`));
  let cursor = 0;

  while (edges.length < target.edges && nodes.length > 1) {
    const source = nodes[cursor % nodes.length];
    const destination = nodes[(cursor * 2 + 3) % nodes.length];
    const type = syntheticEdgeTypes[cursor % syntheticEdgeTypes.length];
    const edgeKey = `${source.id}->${destination.id}:${type}`;
    cursor += 1;

    if (source.id === destination.id || seenEdges.has(edgeKey)) {
      continue;
    }

    seenEdges.add(edgeKey);
    edges.push({
      source: source.id,
      target: destination.id,
      type,
      label: type.replace(/\b\w/g, (letter) => letter.toUpperCase()),
      pressure: Math.min(0.96, target.pressure + (edges.length % 4) * 0.04),
      consequence: `${destination.label} inherits ${source.label.toLowerCase()} pressure under ${intensity} signal intensity.`,
    });
  }

  return {
    ...response,
    graph: {
      nodes,
      edges,
    },
  };
}

export async function POST(request: Request) {
  const parsedRequest = observeRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        error:
          "Provide a scenario, selected Ollama model, and signal intensity before observing emergence.",
      },
      { status: 400 },
    );
  }

  const { scenario, model, intensity } = parsedRequest.data;
  const intensityProfile = getIntensity(intensity);

  try {
    const response = await createOllamaClient().chat({
      model,
      stream: false,
      think: false,
      format: observatoryJsonSchema,
      options: {
        temperature: intensity === "conservative" ? 0.25 : intensity === "emergent" ? 0.45 : 0.65,
        top_p: 0.9,
      },
      messages: [
        {
          role: "system",
          content: [
            "You are designing a public conceptual observatory for machine-native economies.",
            "Return only valid JSON that conforms to the provided schema.",
            "Do not provide investment advice, trading instructions, tokenomics, governance attack plans, production economic infrastructure, or operational system designs.",
            "Use concise, mechanism-aware language. Prefer compressed cybernetic observations over generic warnings.",
            "The output should feel cinematic, infrastructural, strange, and plausible.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            `Scenario: ${scenario}`,
            `Signal intensity: ${intensityProfile.label}. ${intensityProfile.prompt}`,
            `Graph density target: ${intensityProfile.graph}.`,
            "Generate six sections: Economic Topology, Autonomous Behaviors, Emerging Market Structures, Coordination Failures, Machine-Native Incentives, Future Evolution Trajectory.",
            "Every section needs a terse thesis and 3-5 dense signals.",
            "Graph node ids must be short lowercase slugs. Every edge source and target must match an existing node id.",
            "Use node types only from the schema. Use edge types only from the schema.",
            "Each hover field should expose second-order effects, hidden dependencies, delayed consequences, or emergent tensions.",
            `JSON schema: ${JSON.stringify(observatoryJsonSchema)}`,
          ].join("\n"),
        },
      ],
    });

    const content = response.message.content;
    const json = JSON.parse(content);
    const parsedResponse = normalizeGraphDensity(
      observatoryResponseSchema.parse(json),
      intensity,
    );

    return NextResponse.json(parsedResponse);
  } catch (error) {
    return NextResponse.json(
      {
        error: `Ollama observation failed for model "${model}" at ${getOllamaBaseUrl()}: ${messageFromError(error)}`,
      },
      { status: 502 },
    );
  }
}
