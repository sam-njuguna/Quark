# Quark Documentation

Welcome to the Quark documentation.

## Quick Links

| Document | Description |
|----------|-------------|
| [Project Overview](OVERVIEW.md) | Vision, problem solved, competitive landscape |
| [Technical Docs](QUARK.md) | Architecture, API, database, setup |
| [KPIs](KPIs.md) | Metrics and analytics |
| [Agent Guidelines](Agents.md) | How AI agents should use Quark |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        HUMAN                                 │
│         (Interacts via Dashboard or IDE/AI)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS 16 APP                           │
│                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│   │  Dashboard  │    │    MCP      │    │   Server    │   │
│   │  (Shadcn)   │    │   Handler   │    │   Actions   │   │
│   └─────────────┘    └─────────────┘    └─────────────┘   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              BETTER AUTH (Proxy Middleware)        │   │
│   └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEON DATABASE                            │
│                                                             │
│   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────────┐      │
│   │  Users │  │ Teams  │  │  Work   │  │  Outputs   │      │
│   └────────┘  └────────┘  └────────┘  └────────────┘      │
│                                                             │
│   ┌────────┐  ┌────────┐  ┌────────┐                      │
│   │Comments│  │Activity│  │Integr. │                      │
│   └────────┘  └────────┘  └────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

## Getting Started

### 1. Understand the Vision
Read [Project Overview](../multi-agent-orchestration.md) to understand what Quark is and why it exists.

### 2. Set Up the Project
See [Technical Docs](QUARK.md) → Quick Start section.

### 3. Configure Integrations
- Set up Better Auth (magic link or OTP)
- Configure MCP handler for AI agents
- Add external integrations (GitHub, Calendars, etc.)

### 4. Onboard Your Team
Share [Agent Guidelines](Agents.md) with anyone connecting AI agents to Quark.

### 5. Track Metrics
Set up [KPIs](KPIs.md) dashboards for your team.

## Key Concepts

### Work Flow
```
NEW → TRIAGED → IN PROGRESS → AWAITING REVIEW → DONE
                              ↓
                         REVISION → AWAITING REVIEW
                              ↓
                         BLOCKED → IN PROGRESS
```

### MCP Tools
AI agents use MCP to:
- Create work
- List their assigned work
- Submit completed work
- Update work stages
- Add comments

### Authentication
All routes protected via proxy middleware. Users authenticate via Better Auth (magic link or OTP).

## Support

- Discord: https://discord.gg/quark
- Issues: GitHub issues
