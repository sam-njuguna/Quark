# Adding MCP to Any Project

## What is MCP?

MCP (Model Context Protocol) lets AI agents like Claude Code connect to your app and call tools. Think of it as an API specifically designed for AI-to-app communication.

## The Core Concept

```
Your App                    Claude Code
┌──────────┐               ┌────────────┐
│  /api/   │◄─────────────▶│   Agent    │
│   mcp    │   HTTP/SSE    │            │
└──────────┘               └────────────┘
     │                            │
     ▼                            ▼
  Database                   Tools
```

Your app exposes an MCP server → AI agent connects → Calls your tools → Your app executes and returns results.

## Minimal Setup (5 Steps)

### 1. Install
```bash
npm install @modelcontextprotocol/sdk@1.25.2 mcp-handler zod@^3
```

**Note:** SDK 1.25.2 has Zod v3/v4 dual compatibility that causes heap OOM with complex schemas. See "Avoiding Heap Memory Issues" below for the fix.

### 2. Create the Route

```typescript
// src/app/api/[transport]/route.ts

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { createMcpHandler } from "mcp-handler";
import { headers } from "next/headers";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Input Schemas (in a separate file: src/lib/mcp-tools.ts) ───
// Always annotate with z.ZodTypeAny to avoid heap OOM
export const helloInput: z.ZodTypeAny = z.object({
  name: z.string().min(1).describe("Name to greet"),
});

export const addNumbersInput: z.ZodTypeAny = z.object({
  a: z.number().describe("First number"),
  b: z.number().describe("Second number"),
});

// ─── Auth Validation ───
async function validateToken() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing Authorization header. Use: Bearer <token>");
  }
  const token = authHeader.slice(7);
  // Validate token against your database here
  // Return the authenticated user object
  return { id: "user-123", name: "Test User" };
}

// ─── Tool Response Helpers ───
function mcpResponse(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function mcpError(error: unknown) {
  return {
    content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : "Unknown"}` }],
    isError: true,
  };
}

// ─── Tool Handler Wrapper ───
function makeTool<T>(fn: (user: any, params: T) => Promise<unknown>) {
  return async (params: T) => {
    try {
      const user = await validateToken();
      return mcpResponse(await fn(user, params));
    } catch (e) {
      return mcpError(e);
    }
  };
}

// ─── Tool Implementations ───
async function handleHello(user: any, params: { name: string }) {
  return { message: `Hello ${params.name}!`, user: user.name };
}

async function handleAddNumbers(user: any, params: { a: number; b: number }) {
  return { result: params.a + params.b };
}

// ─── MCP Handler ───
const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "hello",
      {
        title: "Say Hello",
        description: "Greet a user by name",
        inputSchema: helloInput,
      },
      makeTool(handleHello),
    );

    server.registerTool(
      "add_numbers",
      {
        title: "Add Numbers",
        description: "Add two numbers together",
        inputSchema: addNumbersInput,
      },
      makeTool(handleAddNumbers),
    );
  },
  {
    serverInfo: { name: "my-project-mcp", version: "1.0.0" },
  },
  {
    basePath: "/api",
    verboseLogs: false,
    maxDuration: 60,
    disableSse: true,
  },
);

export { handler as GET, handler as POST };
```

### 3. Add Authentication (optional but recommended)

Included in the full route above. Key points:
- Extract `Authorization: Bearer <token>` header
- Validate token format prefix (e.g., `qkp_`)
- Look up in database, check expiration
- Update `lastUsedAt` timestamp
- Return authenticated user object

### 4. Connect Claude Code
```json
// .claude/mcp.json
{
  "mcpServers": {
    "myproject": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://localhost:3000/api/mcp", "--header", "Authorization:Bearer qkp_xxx"]
    }
  }
}
```

### 5. Test
```bash
npm run dev
# In Claude Code: /mcp
```

## What Can Tools Do?

- Read data (list users, search, etc.)
- Write data (create, update, delete)
- Execute actions (send email, trigger webhooks)

## ⚠️ Avoiding Heap Memory Issues

When using `@modelcontextprotocol/sdk` with Zod schemas, TypeScript can exhaust heap memory during type checking due to deep generic instantiation. This is a known issue with SDK v1.25+.

### The Fix

**1. Always annotate schemas with `z.ZodTypeAny`:**

```typescript
// ❌ WRONG — causes deep type inference
const myInput = {
  title: z.string(),
  count: z.number().optional(),
};

// ✅ CORRECT — TypeScript sees this as AnySchema, not Record
export const myInput: z.ZodTypeAny = z.object({
  title: z.string(),
  count: z.number().optional(),
});
```

**2. Add `@ts-nocheck` to the route file:**

```typescript
// src/app/api/mcp/route.ts
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { createMcpHandler } from "mcp-handler";
// ... rest of code
```

### Why This Happens

The MCP SDK has a conditional type that checks if your schema is a `Record<string, ZodType>`. When TypeScript tries to resolve this with complex Zod chains (e.g., `ZodOptional<ZodEnum<...>>`), it triggers deep instantiation that hits memory limits.

By annotating with `z.ZodTypeAny`, you tell TypeScript to take the cheaper branch (`SchemaOutput<>` instead of `ShapeOutput<>`), which resolves to `any` for callback params — no deep inference needed.

### Rule Summary

| Rule | Do |
|------|-----|
| Always annotate input schemas | `const schema: z.ZodTypeAny = z.object({...})` |
| Keep schemas in dedicated file | `src/lib/mcp-tools.ts` |
| Route file stays `@ts-nocheck` | It's just wiring, not business logic |
| Don't use raw objects as inputSchema | `{ param: z.string() }` causes OOM |

---

## Pro Tips

- **Use Zod** for input validation
- **Group related tools** (e.g., `create_x`, `list_x`, `update_x`)
- **Add descriptions** - Claude uses them to understand when to call tools
- **Rate limit** if needed (MCP runs over HTTP, so standard rate limiting applies)
