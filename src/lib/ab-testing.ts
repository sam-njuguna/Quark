import { cookies } from "next/headers";
import { nanoid } from "nanoid";

export interface Experiment {
  id: string;
  variants: string[];
  weights?: number[];
}

const EXPERIMENTS: Experiment[] = [
  {
    id: "new-work-form-layout",
    variants: ["control", "sidebar"],
    weights: [0.5, 0.5],
  },
  {
    id: "kanban-card-density",
    variants: ["compact", "comfortable"],
    weights: [0.5, 0.5],
  },
];

function pickVariant(experiment: Experiment, seed: string): string {
  const weights = experiment.weights ?? experiment.variants.map(() => 1 / experiment.variants.length);
  const hash = seed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const normalised = (hash % 100) / 100;
  let cumulative = 0;
  for (let i = 0; i < experiment.variants.length; i++) {
    cumulative += weights[i];
    if (normalised < cumulative) return experiment.variants[i];
  }
  return experiment.variants[0];
}

export async function getVariant(experimentId: string): Promise<string | null> {
  const experiment = EXPERIMENTS.find((e) => e.id === experimentId);
  if (!experiment) return null;

  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("quark-ab-id");
  const userId = userIdCookie?.value ?? nanoid();

  return pickVariant(experiment, `${experimentId}-${userId}`);
}

export function getExperiments(): Experiment[] {
  return EXPERIMENTS;
}
