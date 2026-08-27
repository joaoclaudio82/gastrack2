---
name: gsp:launch
description: Create marketing campaign assets for launch
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - WebSearch
---

<context>
Phase 8 of the GSP design pipeline. Uses the Marketing Asset Factory prompt to create a full campaign asset library across channels.
</context>

<objective>
Create marketing campaign assets for product launch.

**Input:** `.design/brand/IDENTITY.md` + `.design/screens/SCREENS.md`
**Output:** `.design/launch/CAMPAIGN.md`
**Agent:** `gsp-campaign-director`
</objective>

<process>
## Step 1: Load context

Read:

- `.design/brand/IDENTITY.md` — brand voice, visual identity
- `.design/screens/SCREENS.md` — product screens for showcase
- `.design/BRIEF.md` — audience, goals, messaging
- `.design/system/SYSTEM.md` — design system for consistency

If IDENTITY.md doesn't exist, tell the user to run `/gsp:brand` first.

## Step 2: Spawn campaign director

Spawn the `gsp-campaign-director` agent with:

- Brand identity, screens, and brief
- The Marketing Asset Factory prompt (04)
- The launch output template

The agent should deliver:

1. Campaign strategy (objective, audience, key message, tone)
2. Google Ads (copy, visual direction, CTAs, A/B variants)
3. Meta/Instagram and TikTok ads
4. Email sequences (welcome, promo, nurture, re-engagement)
5. Landing page copy and structure
6. Social media posts
7. Sales enablement materials
8. Content marketing outlines

## Step 3: Write output

Write campaign to `.design/launch/CAMPAIGN.md`.

## Step 4: Update state

Update `.design/STATE.md`:

- Set Phase 8 (Launch) status to `complete`
- Record completion date
- Set Prettiness Level to 100%

## Step 5: Celebrate

Display campaign summary and:

```
🎨 Project is fully pretty! All 8 phases complete.

Run /gsp:progress to see the full journey.
```

</process>
