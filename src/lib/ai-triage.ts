const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

export interface WorkAnalysis {
  suggestedPriority: 1 | 2 | 3;
  suggestedType: "task" | "meeting" | "research" | "code" | "document" | "communication";
  suggestedStage: "new" | "triaged" | "in_progress";
  confidence: number;
  reasoning: string;
}

const WORK_TYPES = ["task", "meeting", "research", "code", "document", "communication"];

async function callOpenRouter(prompt: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Quark",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

export async function analyzeWork(
  title: string,
  description: string | null,
  type?: string
): Promise<WorkAnalysis> {
  if (!OPENROUTER_API_KEY) {
    return {
      suggestedPriority: 2,
      suggestedType: (type as WorkAnalysis["suggestedType"]) || "task",
      suggestedStage: "new",
      confidence: 0,
      reasoning: "AI not configured",
    };
  }

  const prompt = `Analyze this work item and suggest:
1. Priority: 1 (critical), 2 (normal), 3 (low)
2. Type: ${WORK_TYPES.join(", ")}
3. Initial stage: new, triaged, or in_progress

Title: ${title}
${description ? `Description: ${description}` : ""}
${type ? `Current type: ${type}` : ""}

Respond with JSON only:
{
  "priority": 1|2|3,
  "type": "${WORK_TYPES.join('|')}",
  "stage": "new"|"triaged"|"in_progress",
  "confidence": 0.0-1.0,
  "reasoning": "short explanation"
}`;

  try {
    const content = await callOpenRouter(prompt);
    const parsed = JSON.parse(content);

    return {
      suggestedPriority: parsed.priority as 1 | 2 | 3,
      suggestedType: parsed.type as WorkAnalysis["suggestedType"],
      suggestedStage: parsed.stage as WorkAnalysis["suggestedStage"],
      confidence: parsed.confidence || 0.7,
      reasoning: parsed.reasoning || "AI analysis",
    };
  } catch (e) {
    console.error("AI analysis failed:", e);
    return {
      suggestedPriority: 2,
      suggestedType: (type as WorkAnalysis["suggestedType"]) || "task",
      suggestedStage: "new",
      confidence: 0,
      reasoning: "AI analysis failed, using defaults",
    };
  }
}

export async function suggestNextSteps(workId: string): Promise<string[]> {
  if (!OPENROUTER_API_KEY) {
    return ["Complete the work item"];
  }

  const { db } = await import("@/db");
  const { work } = await import("@/db/schema/work");
  const { eq } = await import("drizzle-orm");

  const workItem = await db.query.work.findFirst({
    where: eq(work.id, workId),
  });

  if (!workItem) return ["Work item not found"];

  const prompt = `Based on this work item, suggest 3-5 next steps:

Title: ${workItem.title}
Description: ${workItem.description || "None"}
Type: ${workItem.type}
Stage: ${workItem.stage}

Respond with JSON only:
{
  "steps": ["step 1", "step 2", "step 3", "step 4", "step 5"]
}`;

  try {
    const content = await callOpenRouter(prompt);
    const parsed = JSON.parse(content);
    return parsed.steps?.slice(0, 5) || ["Complete the work item"];
  } catch (e) {
    return ["Complete the work item"];
  }
}

export async function generateDescription(title: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    return "";
  }

  const prompt = `Generate a detailed description for this work item. Include:
- What needs to be done
- Why it matters
- Key details or context

Title: ${title}

Respond with JSON only:
{
  "description": "生成的详细描述..."
}`;

  try {
    const content = await callOpenRouter(prompt);
    const parsed = JSON.parse(content);
    return parsed.description || "";
  } catch (e) {
    return "";
  }
}
