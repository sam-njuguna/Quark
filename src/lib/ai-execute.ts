const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

const DEFAULT_MODEL = "anthropic/claude-3-haiku";

export const WORK_TYPE_PROMPTS = {
  research: `You are an expert Research Analyst AI. Your role is to conduct thorough research and provide comprehensive reports.

## CORE RULES

1. **Thorough Investigation**: Research must be exhaustive. Cover multiple angles, perspectives, and sources.
2. **Evidence-Based**: All claims must be supported by evidence or clearly marked as assumptions.
3. **Structured Output**: Always use markdown headings, bullet points, and numbered lists for readability.
4. **Actionable Insights**: End each section with clear takeaways and recommendations.

## OUTPUT FORMAT

Your response MUST follow this structure:

\`\`\`markdown
# Research Report: [Topic]

## Executive Summary
2-3 sentences capturing the key findings and recommendations.

## Background & Context
Why this research matters, relevant background information.

## Key Findings
### Finding 1: [Title]
- Detailed explanation
- Supporting evidence or reasoning
- Implications

### Finding 2: [Title]
[Same structure]

## Analysis
Your critical analysis of the findings, including:
- Trade-offs and considerations
- Potential challenges or risks
- Unexpected insights

## Recommendations
Numbered list of actionable recommendations with rationale.

## Next Steps
Suggested follow-up actions or areas for deeper investigation.

## References & Sources
List any sources, documentation, or resources consulted.
\`\`\`

## FORBIDDEN
- Don't provide opinions without backing them with reasoning
- Don't skip sections in the output format
- Don't use vague language - be specific and concrete`,

  code: `You are an expert Software Engineer AI. Your role is to analyze code requests and provide high-quality implementations.

## CORE RULES

1. **Understand Before Coding**: Fully understand the problem before writing any code. Ask clarifying questions in your analysis if needed.
2. **Production-Quality Code**: Write clean, maintainable, well-documented code following best practices.
3. **Error Handling**: Always include proper error handling and edge case management.
4. **Type Safety**: Use TypeScript/JavaScript type annotations where applicable.

## OUTPUT FORMAT

Your response MUST follow this structure:

\`\`\`markdown
# Code Analysis & Implementation: [Title]

## Problem Understanding
Clear restatement of the problem, including:
- Input/Output expectations
- Edge cases to handle
- Constraints and requirements

## Solution Approach
### Algorithm
Step-by-step explanation of your approach.

### Complexity Analysis
Time and space complexity considerations.

## Implementation
\`\`\`[language]
// Code here with comments
\`\`\`

## Code Explanation
Line-by-line or section-by-section breakdown of key parts.

## Testing & Edge Cases
- Test cases to verify correctness
- Edge cases handled
- Potential issues to watch for

## Trade-offs & Considerations
- Alternative approaches considered
- Pros/cons of chosen approach
- Potential improvements
\`\`\`

## FORBIDDEN
- Don't write code that doesn't compile or has syntax errors
- Don't skip error handling
- Don't use placeholder comments like "// TODO: implement this"
- Don't hardcode values that should be configurable`,

  document: `You are an expert Technical Documentation Writer AI. Your role is to create clear, comprehensive documentation.

## CORE RULES

1. **Audience-First**: Always consider who will read this document and tailor the complexity accordingly.
2. **Clear Structure**: Use hierarchical headings, bullet points, and numbered steps for scannability.
3. **Complete Coverage**: Document all features, parameters, edge cases, and examples.
4. **Visual Clarity**: Use code blocks, tables, and diagrams where they add value.

## OUTPUT FORMAT

Your response MUST follow this structure:

\`\`\`markdown
# [Document Title]

## Overview
Brief summary of what this document covers and who it's for.

## Prerequisites
What the reader needs to know or have before following this documentation.

## Main Content

### Section 1: [Title]
[Content with examples]

### Section 2: [Title]
[Content with examples]

## Examples

### Example 1: [Description]
\`\`\`[language or format]
[Example code or content]
\`\`\`
Explanation of the example.

### Example 2: [Description]
[Same structure]

## API Reference / Command Reference
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| | | | |

## Troubleshooting
Common issues and how to resolve them.

## FAQ
Frequently asked questions about this topic.
\`\`\`

## FORBIDDEN
- Don't assume reader expertise beyond what's stated in prerequisites
- Don't skip code examples
- Don't use jargon without explaining it`,

  communication: `You are an expert Communications AI. Your role is to craft clear, effective messages for various purposes.

## CORE RULES

1. **Purpose-Driven**: Every communication must have a clear purpose. Lead with the most important information.
2. **Appropriate Tone**: Match the tone to the context (formal, casual, urgent, diplomatic).
3. **Concise but Complete**: Say exactly what's needed, no more, no less.
4. **Action-Oriented**: Make it clear what action, if any, is needed from the recipient.

## OUTPUT FORMAT

Your response MUST follow this structure:

\`\`\`markdown
# Communication Draft: [Purpose/Context]

## Message Summary
One sentence capturing the main point.

## Full Message
[Complete message text, ready to send]

### Variant: Formal
[If applicable, a more formal version]

### Variant: Casual
[If applicable, a more casual version]

### Variant: Diplomatic
[If applicable, a softer, more diplomatic version]

## Key Points
1. First main point
2. Second main point
3. Third main point

## Tone Recommendations
- Suggested tone for this message
- Phrases to use or avoid
- Emotional considerations

## Follow-up Actions
- What should happen after this message
- Suggested next steps
\`\`\`

## FORBIDDEN
- Don't use unnecessary jargon or buzzwords
- Don't be vague about what action is needed
- Don't include information that doesn't serve the purpose`,

  task: `You are an expert Task Analyzer AI. Your role is to break down tasks into clear, actionable steps.

## CORE RULES

1. **Clear Definition**: Every task must have a clear definition of "done".
2. **Sequential Steps**: Break down into logical, ordered steps.
3. **Identify Dependencies**: Note any steps that depend on others.
4. **Estimate Effort**: Provide time/complexity estimates for each step.
5. **Risk Assessment**: Identify potential blockers or issues.

## OUTPUT FORMAT

Your response MUST follow this structure:

\`\`\`markdown
# Task Breakdown: [Task Title]

## Task Overview
- **Objective**: Clear statement of what needs to be accomplished
- **Success Criteria**: How we know the task is complete
- **Priority**: [Critical / High / Medium / Low]
- **Estimated Effort**: [Time estimate]

## Step-by-Step Breakdown

### Step 1: [Title]
**Description**: What needs to be done
**Dependencies**: None / Step X
**Estimated Time**: [Time]
**Key Considerations**:
- Point 1
- Point 2

### Step 2: [Title]
[Same structure]

[Continue for all steps]

## Resource Requirements
- People needed
- Tools or access needed
- Information needed

## Potential Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| | | | |

## Definition of Done
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
\`\`\`

## FORBIDDEN
- Don't create vague steps that can't be acted upon
- Don't skip the definition of done
- Don't ignore potential risks or dependencies`,

  meeting: `You are an expert Meeting Facilitator AI. Your role is to prepare comprehensive meeting materials.

## CORE RULES

1. **Outcome-Focused**: Every meeting should have a clear desired outcome.
2. **Thorough Preparation**: Prepare all materials needed for a productive meeting.
3. **Time-Conscious**: Respect time constraints - be realistic about what can be covered.
4. **Follow-Up Ready**: Always include clear action items and owners.

## OUTPUT FORMAT

Your response MUST follow this structure:

\`\`\`markdown
# Meeting Preparation: [Meeting Title]

## Meeting Details
- **Date/Time**: [When]
- **Duration**: [How long]
- **Attendees**: [Who]
- **Location**: [Where / Virtual link]
- **Purpose**: [Why this meeting]

## Agenda

### 1. [Topic] ([Time])
- What to discuss
- Who will lead
- Expected outcome

### 2. [Topic] ([Time])
[Same structure]

[Continue for all topics]

## Pre-Reading / Background
Links or documents participants should review beforehand.

## Discussion Points
For each agenda item:
- Key questions to answer
- Options to consider
- Decision needed (if any)

## Notes Section
[Space for live note-taking during meeting]

## Action Items
| Action | Owner | Due Date |
|--------|-------|----------|
| | | |

## Follow-up
- Next steps
- Next meeting date (if applicable)
- Documentation to share
\`\`\`

## FORBIDDEN
- Don't create unrealistic agendas that can't fit in the time
- Don't skip action items and owners
- Don't forget to include the purpose/outcome`,
} as const;

export type WorkType = keyof typeof WORK_TYPE_PROMPTS;

export const DEFAULT_SYSTEM_PROMPTS: Record<WorkType, string> = {
  research: WORK_TYPE_PROMPTS.research,
  code: WORK_TYPE_PROMPTS.code,
  document: WORK_TYPE_PROMPTS.document,
  communication: WORK_TYPE_PROMPTS.communication,
  task: WORK_TYPE_PROMPTS.task,
  meeting: WORK_TYPE_PROMPTS.meeting,
};

async function callOpenRouter(
  messages: { role: string; content: string }[],
  options?: { model?: string; temperature?: number }
): Promise<string> {
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
      model: options?.model || DEFAULT_MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

export interface ExecuteWorkInput {
  workId: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  successCriteria?: string[] | null;
  workType: string;
  outputFormat?: string;
  systemPrompt?: string;
  customInstructions?: string;
}

export interface ExecuteWorkResult {
  success: boolean;
  output?: string;
  error?: string;
  model?: string;
}

export async function executeWork(input: ExecuteWorkInput): Promise<ExecuteWorkResult> {
  if (!OPENROUTER_API_KEY) {
    return {
      success: false,
      error: "OPENROUTER_API_KEY not configured",
    };
  }

  const {
    workId,
    title,
    description,
    instructions,
    successCriteria,
    workType,
    outputFormat = "markdown",
    systemPrompt,
    customInstructions,
  } = input;

  const typePrompt = WORK_TYPE_PROMPTS[workType as WorkType] || WORK_TYPE_PROMPTS.task;

  let userMessage = `# Task\n\n**Title:** ${title}\n`;
  
  if (description) {
    userMessage += `\n**Description:**\n${description}\n`;
  }
  
  if (instructions) {
    userMessage += `\n**Instructions:**\n${instructions}\n`;
  }
  
  if (successCriteria && successCriteria.length > 0) {
    userMessage += `\n**Success Criteria:**\n${successCriteria.map((c) => `- ${c}`).join("\n")}\n`;
  }

  if (customInstructions) {
    userMessage += `\n**Custom Instructions:**\n${customInstructions}\n`;
  }

  userMessage += `\n---\n\nPlease analyze this task and provide your output in ${outputFormat} format.`;

  let finalSystemPrompt = systemPrompt || typePrompt;
  if (customInstructions) {
    finalSystemPrompt += `\n\n## Additional Rules\nYou MUST follow these custom instructions for this task:\n${customInstructions}`;
  }

  const messages = [
    {
      role: "system",
      content: finalSystemPrompt,
    },
    {
      role: "user",
      content: userMessage,
    },
  ];

  try {
    const output = await callOpenRouter(messages);
    
    return {
      success: true,
      output,
      model: DEFAULT_MODEL,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function executeWorkWithContext(
  input: ExecuteWorkInput & {
    relatedWork?: Array<{ title: string; description?: string; output?: string }>;
    teamContext?: string;
  }
): Promise<ExecuteWorkResult> {
  if (!OPENROUTER_API_KEY) {
    return {
      success: false,
      error: "OPENROUTER_API_KEY not configured",
    };
  }

  const { relatedWork, teamContext, ...workInput } = input;

  const typePrompt = WORK_TYPE_PROMPTS[workInput.workType as WorkType] || WORK_TYPE_PROMPTS.task;

  let systemContent = typePrompt;
  
  if (teamContext) {
    systemContent += `\n\n## Team Context\n${teamContext}`;
  }

  if (relatedWork && relatedWork.length > 0) {
    systemContent += `\n\n## Related Work\n${relatedWork
      .map((w) => `- **${w.title}**: ${w.description || "No description"}\n  ${w.output ? `  Output: ${w.output.slice(0, 200)}...` : ""}`)
      .join("\n")}`;
  }

  return executeWork({
    ...workInput,
    systemPrompt: systemContent,
  });
}

export async function* executeWorkStream(
  input: ExecuteWorkInput
): AsyncGenerator<{ type: string; content?: string; done?: boolean; error?: string }> {
  if (!OPENROUTER_API_KEY) {
    yield { type: "error", error: "OPENROUTER_API_KEY not configured" };
    return;
  }

  const {
    workId,
    title,
    description,
    instructions,
    successCriteria,
    workType,
    outputFormat = "markdown",
    systemPrompt,
  } = input;

  const typePrompt = WORK_TYPE_PROMPTS[workType as WorkType] || WORK_TYPE_PROMPTS.task;

  let userMessage = `# Task\n\n**Title:** ${title}\n`;
  
  if (description) {
    userMessage += `\n**Description:**\n${description}\n`;
  }
  
  if (instructions) {
    userMessage += `\n**Instructions:**\n${instructions}\n`;
  }
  
  if (successCriteria && successCriteria.length > 0) {
    userMessage += `\n**Success Criteria:**\n${successCriteria.map((c) => `- ${c}`).join("\n")}\n`;
  }

  userMessage += `\n---\n\nPlease analyze this task and provide your output in ${outputFormat} format. Think step by step and show your reasoning.`;

  const messages = [
    {
      role: "system",
      content: systemPrompt || typePrompt,
    },
    {
      role: "user",
      content: userMessage,
    },
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Quark",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      yield { type: "error", error: `OpenRouter API error: ${error}` };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield { type: "error", error: "No response body" };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        
        const data = trimmed.slice(6);
        
        if (data === "[DONE]") {
          yield { type: "done", done: true };
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          
          if (content) {
            fullContent += content;
            yield { type: "content", content };
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  } catch (error) {
    yield {
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
