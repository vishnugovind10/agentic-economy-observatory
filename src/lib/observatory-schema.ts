import { z } from "zod/v3";

export const scenarioPresets = [
  {
    title: "Autonomous compute market",
    prompt:
      "AI agents negotiating compute capacity across latency-sensitive inference clusters.",
  },
  {
    title: "AI-to-AI API economy",
    prompt:
      "Specialized agents buying API calls from other agents while routing payments through executable wallets.",
  },
  {
    title: "Synthetic research collective",
    prompt:
      "Autonomous research agents pooling models, datasets, citations, and compute to produce machine-generated science.",
  },
  {
    title: "Autonomous logistics swarm",
    prompt:
      "Delivery agents, warehouse robots, routing protocols, and machine wallets coordinating physical movement.",
  },
  {
    title: "Machine-native insurance pool",
    prompt:
      "Autonomous agents pricing operational risk, streaming premiums, and settling claims through execution proofs.",
  },
  {
    title: "AI labor marketplace",
    prompt:
      "Task-buying agents contracting specialist AI workers across reputation, latency, and completion guarantees.",
  },
  {
    title: "Autonomous media licensing",
    prompt:
      "Creative agents licensing synthetic media, negotiating rights, and routing royalties between machine wallets.",
  },
] as const;

export const intensityOptions = [
  {
    id: "conservative",
    label: "Conservative",
    prompt:
      "Use restrained language, plausible early structures, sparse dependencies, and low instability.",
    graph: "7-8 nodes and 8-10 edges",
  },
  {
    id: "emergent",
    label: "Emergent",
    prompt:
      "Emphasize market formation, visible bottlenecks, stronger feedback loops, and medium instability.",
    graph: "9-10 nodes and 11-14 edges",
  },
  {
    id: "chaotic",
    label: "Chaotic",
    prompt:
      "Increase coordination failure pressure, unstable incentives, crowded dependencies, and recursive effects.",
    graph: "11-12 nodes and 15-18 edges",
  },
  {
    id: "post-human",
    label: "Post-Human",
    prompt:
      "Make the system strange but believable, with machine-latency abstractions and maximum institutional drift.",
    graph: "13-14 nodes and 19-22 edges",
  },
] as const;

export const intensityIds = intensityOptions.map((option) => option.id);

export const sectionSchema = z.object({
  title: z.string(),
  thesis: z.string(),
  signals: z.array(z.string()).min(3).max(5),
});

export const nodeTypeSchema = z.enum([
  "agent",
  "market",
  "wallet",
  "protocol",
  "trust layer",
  "compute layer",
  "governance layer",
  "coordination hub",
]);

export const edgeTypeSchema = z.enum([
  "payment flow",
  "negotiation",
  "trust dependency",
  "execution routing",
  "coordination pressure",
  "liquidity flow",
]);

export const observatoryNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: nodeTypeSchema,
  summary: z.string(),
  secondOrderEffect: z.string(),
  hiddenDependency: z.string(),
  delayedConsequence: z.string(),
  emergentTension: z.string(),
});

export const observatoryEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  type: edgeTypeSchema,
  label: z.string(),
  pressure: z.number().min(0).max(1),
  consequence: z.string(),
});

export const observatoryResponseSchema = z.object({
  topology: sectionSchema,
  behaviors: sectionSchema,
  markets: sectionSchema,
  failures: sectionSchema,
  incentives: sectionSchema,
  trajectory: sectionSchema,
  graph: z.object({
    nodes: z.array(observatoryNodeSchema).min(6).max(16),
    edges: z.array(observatoryEdgeSchema).min(6).max(24),
  }),
});

export const observeRequestSchema = z.object({
  scenario: z.string().trim().min(8).max(1200),
  model: z.string().trim().min(1).max(120),
  intensity: z.enum(["conservative", "emergent", "chaotic", "post-human"]),
});

export type IntensityId = (typeof intensityOptions)[number]["id"];
export type ObservatoryResponse = z.infer<typeof observatoryResponseSchema>;
export type ObservatoryNode = z.infer<typeof observatoryNodeSchema>;
export type ObservatoryEdge = z.infer<typeof observatoryEdgeSchema>;

export function getIntensity(id: IntensityId) {
  return intensityOptions.find((option) => option.id === id) ?? intensityOptions[1];
}
