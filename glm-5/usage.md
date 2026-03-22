> ## Documentation Index
>
> Fetch the complete documentation index at: https://docs.z.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

The GLM Coding Plan is a subscription package designed specifically for AI-powered coding. With a minimal investment, you can enjoy Zai’s high-intelligence models across mainstream AI coding tools, delivering an intelligent, fast, and stable coding experience.

<Tip>
  **The Max and Pro plan currently support GLM-5**. Subsequently, the Lite plan will also support GLM-5 once the iteration of new and old model resources is completed. At this stage, all plans support GLM-4.7 and legacy text models, and invoking GLM-5 will consume more plan quota than historical models.
</Tip>

## <Icon icon="list" iconType="solid" color="#ffffff" size={36} /> Usage

The plan can be applied to coding tools such as Claude Code, Cline, and OpenCode, covering a wide range of development scenarios:

<AccordionGroup>
  <Accordion title="Natural Language Programming">
    Describe requirements in plain language to automatically generate plans, write code, debug issues, and ensure smooth execution.
  </Accordion>

  <Accordion title="Intelligent Code Completion">
    Get real-time, context-aware completion suggestions that reduce manual typing and significantly improve productivity.
  </Accordion>

  <Accordion title="Code Debugging & Repair">
    Input error messages or descriptions to automatically analyze your codebase, locate problems, and provide fixes.
  </Accordion>

  <Accordion title="Codebase Q&A">
    Ask questions about your team’s codebase anytime, maintain global understanding, and receive precise answers with external data integration.
  </Accordion>

  <Accordion title="Automated Task Handling">
    Automatically fix lint issues, resolve merge conflicts, and generate release notes—allowing developers to stay focused on core logic.
  </Accordion>
</AccordionGroup>

## <Icon icon="stars" iconType="solid" color="#ffffff" size={36} /> Advantages

- **Access to high-intelligence Coding Model:** Upon release, the GLM series achieved SOTA performance among open-source models in reasoning, coding, and agent capabilities, delivering outstanding results in tool use and complex task execution.
- **Works with Multiple Coding Tools:** Beyond Claude Code, it also supports Cline, OpenCode, and other mainstream coding tools, giving you flexibility across development workflows.
- **Faster, More Reliable Response:** Generate over 55 tokens per second for real-time interaction. No network restrictions, no account bans—just smooth, uninterrupted coding.
- **Generous Usage at a Fair Price:** Get higher call limits than standard plans. Starting at just 3 USD per month, with Pro plans from 15 USD per month designed for high-frequency, complex projects.
- **Expanded Capabilities:** All plans support Vision Understanding, Web Search MCP and Web Reader MCP supporting multimodal analysis and real-time information retrieval.

## <Icon icon="gauge-max" iconType="solid" color="#ffffff" size={36} /> Usage Limits

### Usage Instruction

To manage resources and ensure fair access for all users, we apply usage limits on a 5-hour and weekly basis. You can check your quota consumption progress in [Usage Statistics](https://z.ai/manage-apikey/subscription).

One prompt refers to one query. Each prompt is estimated to invoke the model 15–20 times.

**The monthly available quota is converted based on API pricing, equivalent to approximately 15–30× the monthly subscription fee (weekly caps already factored in).**

| Plan Type | 5-Hour Limit (Dynamically refreshed; quota resets 5 hours after consumption) | Weekly Limit (Activated upon subscription; resets every 7 days) |
| --------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Lite Plan | Up to approx. 80 prompts                                                     | Up to approx. 400 prompts                                       |
| Pro Plan  | Up to approx. 400 prompts                                                    | Up to approx. 2,000 prompts                                     |
| Max Plan  | Up to approx. 1,600 prompts                                                  | Up to approx. 8,000 prompts                                     |

<Note>
  * The above figures are estimates. Actual available usage may vary depending on project complexity, repository size, and whether auto-accept is enabled.
  * **GLM-5** has a larger parameter size and is benchmarked against the Claude Opus model. Its usage will be deducted at **3 × during peak hours** and **2 × during off-peak hours**. We recommend switching to GLM-5 for complex tasks and continuing to use GLM-4.7 for routine tasks to avoid rapid quota consumption.
    Peak hours are 14:00–18:00 (UTC+8).
  * For users who subscribed and enabled auto-renewal before February 12 (UTC+8), the original quota will remain in effect throughout the subscription validity period, and no weekly usage limits will apply.
  * For users who enabled auto-renewal before February 12, both the renewal price and the usage quota will remain unchanged and will continue to follow the limits shown at the time of your original subscription.
</Note>

### Supported Tools

- The plan can only be used within specific coding tools, including Claude Code, Roo Code, Kilo Code, Cline, OpenCode, Crush, Goose,OpenClaw and more.
- Once subscribed, GLM-4.7 is automatically available in the supported tools using your plan’s quota—no additional configuration required. If the quota is exhausted, it will automatically reset at the start of the next 5-hour cycle. The system will not consume other resource packs or account balance. Users with a Coding Plan can only use the plan’s quota in supported tools and cannot call the model separately via API.
- API calls are billed separately and do not use the Coding Plan quota. Please refer to the API pricing for details.

### How to Switch Models

Mapping between Claude Code internal model environment variables and GLM models, with the default configuration as follows:

- `ANTHROPIC_DEFAULT_OPUS_MODEL`: `GLM-4.7`
- `ANTHROPIC_DEFAULT_SONNET_MODEL`: `GLM-4.7`
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`: `GLM-4.5-Air`

If adjustments are needed, you can directly modify the configuration file (for example, `~/.claude/settings.json` in Claude Code) to switch to GLM-4.5 or other models.

## <Icon icon="list-check" iconType="solid" color="#ffffff" size={36} /> How to Integrate with Coding Tools

<CardGroup cols={3}>
  <Card title="Claude Code" color="#ffffff" href="https://docs.z.ai/devpack/tool/claude" />

  <Card title="Roo Code" color="#ffffff" href="https://docs.z.ai/devpack/tool/roo" />

  <Card title="OpenClaw" color="#ffffff" href="https://docs.z.ai/devpack/tool/openclaw" />

  <Card title="Kilo Code" color="#ffffff" href="https://docs.z.ai/devpack/tool/kilo" />

  <Card title="Cline" color="#ffffff" href="https://docs.z.ai/devpack/tool/cline" />

  <Card title="OpenCode" color="#ffffff" href="https://docs.z.ai/devpack/tool/opencode" />

  <Card title="Crush" color="#ffffff" href="https://docs.z.ai/devpack/tool/crush" />

  <Card title="Goose" color="#ffffff" href="https://docs.z.ai/devpack/tool/goose" />

  <Card title="Other Tools" color="#ffffff" href="https://docs.z.ai/devpack/tool/others" />
</CardGroup>

## <Icon icon="dollar-sign" iconType="solid" color="#ffffff" size={36} /> Billing and Invoices

You can manage your subscription, view billing details, and cancel the subscription as follows:

1. Log in to the Z.ai [API Platform](https://z.ai/subscribe?utm_source=zai&utm_medium=index&utm_term=glm-coding-plan&utm_campaign=Platform_Ops&_channel_track_key=6lShUDnv).
2. Click your profile icon in the top-right corner → [Payment Method](https://z.ai/manage-apikey/billing).
3. In the left menu, select [Subscription](https://z.ai/manage-apikey/subscription).
4. To view billing history, go to Billing → [Billing History](https://z.ai/manage-apikey/billing).

<Steps>
  <Step title="How do I request a refund?" icon="stars">
    Please note that subscriptions are non-refundable once purchased. Even if you haven’t used your full plan, the fees cannot be returned. We recommend choosing a subscription plan and billing cycle that best fits your usage needs.
  </Step>
</Steps>

## <Icon icon="shield-quartered" iconType="solid" color="#ffffff" size={36} /> Data Privacy

- All [Z.ai](http://z.ai/) services are based in Singapore.
- We do not store any of the content you provide or generate while using our Services. This includes any text prompts, images, or other data you input.
- See [Privacy Policy](https://docs.z.ai/legal-agreement/privacy-policy) for furture details.

Built with [Mintlify](https://mintlify.com).
